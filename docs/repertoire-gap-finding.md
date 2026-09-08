# Repertoire gap-finding

Tabiya can import a learner-owned opening repertoire from pasted PGN or one explicit
public Lichess study. The importer walks every game, chapter, and variation, records
only learner-side moves, and keys answers by normalized position. Transpositions share
coverage without a move-order-specific card tree.

Before a fetched study is parsed or stored, its game comments, starting comments,
numeric annotation glyphs, and comment-encoded board drawings are removed. Headers and
the complete move/variation tree remain. This keeps someone else's study prose from
entering the private repertoire record as authored-looking material while preserving
the learner's opening choices.

The Learn surface scans opponent replies against a Lichess Explorer population. Path
frequencies multiply from raw counts, same-ply transpositions merge before expansion,
and replies below the learner's `1 in N games` bound are pruned. Corpus abstention stops
that subtree: unknown frequency remains unknown. Query and ply limits produce an
explicit partiality sentence before any gap. Every result retains the corpus guard:

> These counts say what this population played, not what is good.

The learner chooses the rating band and `1 in N` coverage bound during import; they are
not hidden defaults. The result states total uncovered mass, turns it into a lower bound
when a scan is partial, names repertoire positions the walk did not reach, lists
alternate-line gaps without a fabricated frequency, and renders every corpus
abstention after the ranked gaps. When an explicit answer changes the repertoire, the
old result is visibly stale until a completed rescan replaces it. A rescan waits for a
new scan receipt rather than mistaking the prior ready result for the new job.

The biggest-gap action creates an ordinary pack-free position run after the uncovered
opponent reply. Its run row, host grant, and repertoire link are one transaction. The
learner plays, rewinds, branches, compares, and returns through the normal attempt
scheduler. Playing never edits the repertoire automatically; an answer is added only
through an explicit digest-guarded mutation. Once a gap has a countable attempt, its
Learn card lists the distinct first moves the learner actually tried. Choosing one is
an explicit action; the refreshed card names it as the current repertoire answer and
the gap moves to `answered`. The gap response therefore carries both `firstMoves` and
the current rank-zero `answer`, rather than asking the client to infer either from run
history. The same explicit choices appear in the linked run's completed-attempt sheet,
including after a direct route load. If the human model is deployed, entry uses the
selected repertoire band. If it is unavailable but Stockfish is present, the action
names Stockfish before the learner selects it; when neither opponent is available the
control is disabled with the reason. A linked run always remains reopenable.

Repertoires are private to their owner. Foreign reads are indistinguishable from
missing data. Study fetches are credential-free and serialized with ordinary Lichess
imports; corpus requests contain position and population but no learner identity.
Account deletion removes repertoire rows and links while existing run semantics remain
unchanged. Learn also offers an explicit repertoire deletion confirmation. It names
that imported moves, scans, and links are removed while already-created rehearsal runs
remain in saved history.

Settings/re-import editing is not exposed yet. The archived RFC requires optimistic
concurrency and scan-staleness after those edits, but its published digest excludes the
rating band and coverage bound. D3146 owns the required contract repair; widening the
content digest or shipping a reusable concurrency token ad hoc would make the current
documentation dishonest.

Migration 15 creates `repertoires`, `repertoire_moves`, `repertoire_scans`, and
`repertoire_gap_runs`. It changes neither pack nor run schema and deliberately leaves
`run_derivations` closed.
