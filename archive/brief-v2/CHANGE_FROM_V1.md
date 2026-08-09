# What changed from the first brief

## The first brief's central mistake

It recast the project as:

> mine a player's games → detect recurring weaknesses → generate personal position episodes → measure transfer back into future games.

That is a legitimate adjacent product, but it is not the idea under evaluation. It caused three downstream errors:

1. It treated personal-history analysis as the product's identity rather than an optional recommender.
2. It compared primarily against personalized SaaS coaches instead of against drills, sparring workflows, opening trainers, position players, and endgame conversion tools.
3. It treated paid SaaS occupancy as a stronger kill signal than it should be for a self-hosted tool.

## Correct product definition

The product is a **phase drill laboratory** for serious improvers:

- Opening theory is drilled as moves, ideas, structures, move-order sensitivity, and the kinds of middlegames it creates.
- Middlegames are rehearsed as multi-move plans where a merely decent move can lose a tempo, change the order of pawn breaks, or let an attack arrive one or two moves earlier.
- Endgames are drilled to an outcome: win, hold, save, or maximize resistance.
- Critical positions are rewindable. Alternative attempts remain as branches instead of being destroyed by a takeback.
- A player can redo a complete middlegame segment, not only retry a single move.
- A branch may naturally become a conversion drill or a save-the-game drill.
- Personal game history may later select which packs to prioritize, but the content and interaction work without it.

## Correct competitive interpretation

Paid SaaS products still matter as implementation and UX benchmarks. They do **not** invalidate the value of a fast, local, owned tool. For a public commercial product they remain substitutes; for the immediate build decision they are not a blocker.

The relevant comparison is therefore:

> Can one free/self-hosted workflow already provide conceptual opening rehearsal, multi-move middlegame branching, and practical endgame outcomes with good UX?

The answer from the reviewed landscape is **no**. The pieces exist separately.

## Correct risk statement

The risk is not mainly “competitors already analyze games.” The risk is:

> Stockfish + Maia + a database may still produce shallow training unless drill content, checkpoints, opponent policies, and branch comparison are explicitly designed around chess concepts.

That is the central research problem in this package.
