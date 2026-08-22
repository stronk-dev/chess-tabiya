# Runtime opening identity — three facts, not one sticky label

**Question:** Wave C C3 / D894

**Date:** 2026-08-22

**Instrument:** `tools/d894-opening-runtime-harness/`

**Production status:** research only; no adapter or learner surface is authorized

## Verdict

The pinned Lichess catalogue can support runtime opening context, but only if the product keeps
three facts separate:

1. **named endpoint now** — the current transposition key is exactly one named ECO row;
2. **catalogue-path membership now** — the current key occurs somewhere inside one or more source
   lines, which does not identify one opening;
3. **deepest named endpoint previously reached** — a retrospective game fact, not the identity of
   the current position.

The existing planning phrase “deepest match wins” is safe only for the third fact. Carrying it as
the live position identity would be stale in every game in the fixed imported sample. Absence from
the named-endpoint index also does **not** mean “out of book”: 126 sampled nodes occur on a
catalogue path without themselves being named endpoints. `[V]`
(`tools/d894-opening-runtime-harness/output.md`)

## Source and reproducibility

The repository pins `lichess-org/chess-openings` commit
`4b8622759e7ae6f93f011cc6c83a3823401ab45e` in
`apps/server/src/sourcing/openings.ts`. The five source TSVs at that commit contain **3,810** data
rows, correcting the inherited 3,627-row claim. `[V]`
([upstream source](https://github.com/lichess-org/chess-openings/tree/4b8622759e7ae6f93f011cc6c83a3823401ab45e);
`tools/d894-opening-runtime-harness/README.md` records each fetched file's SHA-256)

The instrument parses every source PGN with `chessops`, keys every reached position with the same
`transposeKey` used by production, and measures both named terminal keys and all intermediate path
keys against `importedPopulation()`: 108 complete standard games, stratified 12 each across three
time controls and three rating bands. `[V]`
(`tools/research-chess/populations.ts`; `tools/d894-opening-runtime-harness/opening-runtime.test.ts`)

## Results

### Source shape

| measure | result |
|---|---:|
| source rows | 3,810 |
| unique named-endpoint transposition keys | **3,810** |
| endpoint keys with multiple identities | **0** |
| unique keys anywhere on a catalogue path | 7,854 |
| maximum descendant named lines at one path key | 2,023 |

The pre-registered expectation of endpoint ambiguity was refuted: at this pinned version every
named terminal position has one identity. Prefix ambiguity is real and much larger—the starting
branches share positions before their names become applicable—but those descendant names are not
identities of the prefix. `[V]` (`tools/d894-opening-runtime-harness/output.md`)

### Imported-game reach

| ply band | positions | named endpoint | anywhere on catalogue path | prior named endpoint but absent now |
|---|---:|---:|---:|---:|
| 1–4 | 432 | 316 (73.1%) | 365 (84.5%) | 116 (26.9%) |
| 5–8 | 432 | 71 (16.4%) | 133 (30.8%) | 361 (83.6%) |
| 9–12 | 430 | 12 (2.8%) | 26 (6.0%) | 418 (97.2%) |
| 13–16 | 424 | 1 (0.2%) | 2 (0.5%) | 423 (99.8%) |
| 17–20 | 419 | 1 (0.2%) | 1 (0.2%) | 418 (99.8%) |
| 21+ | 4,854 | 0 | 0 | 4,854 (100%) |

All 108 games reach at least one named endpoint, but exact named endpoints cover only **401/6,991
positions (5.7%)**. The deepest named match has median/p90 ply **4/8**. All-catalogue-path coverage
is only **527/6,991 (7.5%)**. Every game later reaches a position where its prior name is no longer
an exact current-position identity. `[V]` (`tools/d894-opening-runtime-harness/output.md`)

This is not a weakness of the catalogue. It is evidence that opening identity is naturally an
early-game and retrospective-game primitive, not a permanent position annotation. `[M]`

## Contract handed to an RFC

The runtime adapter should expose independent, versioned results:

- `opening.named_endpoint@1`: exact current `transposeKey` → `{ eco, name, matchedPly,
  catalogueVersion }` or `no_named_endpoint`;
- `opening.catalogue_membership@1`: exact current `transposeKey` → membership plus candidate
  count, never a chosen descendant name, or `no_catalogue_path`;
- `opening.deepest_reached@1`: history projection over a completed/recorded line → the deepest
  exact named endpoint actually visited, with its ply and source version.

“Out of book” needs its own declared convention. It may mean the first post-start node absent from
the all-prefix index, but it may not mean “not a named endpoint,” and re-entry through transposition
must be represented rather than erased. `[M]`

The adapter should not claim `move-order` versus `transposition` from a position key alone. That
basis requires comparing the observed history with a source line; if no consumer acts differently,
omit it. `[M]`

Consumers then choose the truthful fact: Theory uses exact current applicability; Review and
player-opening summaries use deepest reached; bots may consume a separate opening-book policy but
must not treat a retrospective name as a legal-move prior. The LLM and FTS remain outside
applicability. `[M]`

## Falsifiers and fixtures

An RFC is not buildable unless it includes:

- two move orders reaching one exact key;
- an unnamed prefix with many descendant names (must not select one);
- a named endpoint followed by an absent position (live identity abstains; history retains it);
- catalogue exit and later transposition re-entry;
- exact source-version propagation and source-unavailable abstention.

The first exact-abstention witness in the fixed population is
`https://lichess.org/ZoaIX0pA#4`, after `d7d6`. `[V]`
(`tools/d894-opening-runtime-harness/output.md`)

## Downstream consequence

C3's catalogue/reach question is answered. F7 still needs the runtime adapter RFC and the separate
F4 cited-theory bundle; this dossier does not pretend an ECO label is theory explanation. Review
may use the retrospective opening fact once compiled, while “accuracy by opening” and longitudinal
style need F9's observation store and denominators. `[M]`
