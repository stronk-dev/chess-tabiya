# Repertoire gap-finding

Tabiya can import a learner-owned opening repertoire from pasted PGN or one explicit
public Lichess study. The importer walks every game, chapter, and variation, records
only learner-side moves, and keys answers by normalized position. Transpositions share
coverage without a move-order-specific card tree.

The Learn surface scans opponent replies against a Lichess Explorer population. Path
frequencies multiply from raw counts, same-ply transpositions merge before expansion,
and replies below the learner's `1 in N games` bound are pruned. Corpus abstention stops
that subtree: unknown frequency remains unknown. Query and ply limits produce an
explicit partiality sentence before any gap. Every result retains the corpus guard:

> These counts say what this population played, not what is good.

The biggest-gap action creates an ordinary pack-free position run after the uncovered
opponent reply. Its run row, host grant, and repertoire link are one transaction. The
learner plays, rewinds, branches, compares, and returns through the normal attempt
scheduler. Playing never edits the repertoire automatically; an answer is added only
through an explicit digest-guarded mutation.

Repertoires are private to their owner. Foreign reads are indistinguishable from
missing data. Study fetches are credential-free and serialized with ordinary Lichess
imports; corpus requests contain position and population but no learner identity.
Account deletion removes repertoire rows and links while existing run semantics remain
unchanged.

Migration 15 creates `repertoires`, `repertoire_moves`, `repertoire_scans`, and
`repertoire_gap_runs`. It changes neither pack nor run schema and deliberately leaves
`run_derivations` closed.
