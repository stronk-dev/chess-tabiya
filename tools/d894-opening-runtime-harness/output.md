# D894 exact runtime opening-identity output

Pinned source rows: 3,810; unique exact transposition keys: 3,810.
Keys with multiple rows: 0; keys with multiple ECO/name identities: 0; maximum rows/key: 1.
Unique catalogue path keys (all prefixes): 7,854; maximum descendant opening identities at one path key: 2023.

Imported games: 108; games with ≥1 exact match: 108 (100.0%); games where carrying the last name would later become stale: 108 (100.0%).
Exact matched nodes: 401/6991 (5.7%); deepest exact match median/p90 ply among matched games: 4/8.
Nodes occurring anywhere on a catalogue path: 527/6991 (7.5%). Catalogue occurrence is not a unique opening identity.

| ply band | nodes | named endpoint | anywhere on catalogue path | prior named endpoint but current absence (stale carry exposure) |
|---|---:|---:|---:|---:|
| 1–4 | 432 | 316 (73.1%) | 365 (84.5%) | 116 (26.9%) |
| 5–8 | 432 | 71 (16.4%) | 133 (30.8%) | 361 (83.6%) |
| 9–12 | 430 | 12 (2.8%) | 26 (6.0%) | 418 (97.2%) |
| 13–16 | 424 | 1 (0.2%) | 2 (0.5%) | 423 (99.8%) |
| 17–20 | 419 | 1 (0.2%) | 1 (0.2%) | 418 (99.8%) |
| 21–30 | 1010 | 0 (0.0%) | 0 (0.0%) | 1010 (100.0%) |
| 31+ | 3844 | 0 (0.0%) | 0 (0.0%) | 3844 (100.0%) |

First exact-abstention witness: https://lichess.org/ZoaIX0pA#4:d7d6.

Interpretation: the pinned catalogue gives each named terminal position one identity, so an exact node lookup returns that identity or honest absence. Prefix membership only proves that the position occurs on at least one catalogue path and may have many descendant names. A game summary may separately select the deepest named endpoint reached. Carrying the last name onto later positions is measured stale exposure, not runtime applicability.
