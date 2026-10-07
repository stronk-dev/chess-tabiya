# D3513 — separate raw recordings from source history

Owner-authorized repository maintenance, not production search implementation.
The starting unpublished range contains 29 commits and 918,659,434 logical new
blob bytes; 719,224,324 belong to semantic-consequence-search. Git may delta-compress
similar text, so these sums are not a prediction of network transfer or packed size.

## Preservation and layout

All 28 newly introduced recordings of at least 1 MiB in the two research directories
are copied to `~/.local/share/tabiya/research-artifacts/objects/<prefix>/<sha256>`.
The retained population totals **722,980,928 bytes**. Each exported file is first
compared with its committed Git bytes, then the stored copy is hash/size checked.
`planning/research-artifacts.json` is the small in-Git manifest. Original working files
remain at their historical paths, ignored rather than deleted. Original measured
transcripts, timestamps, source snapshots, refusals and population counts stay intact.

Explicit `make research-artifacts-restore` verifies the complete stored population
before writing any missing destination; it refuses corrupt/missing objects, symlinks
and conflicting files. This keeps all existing Node/Python reader paths and frozen
source digests valid without modifying the eighteen measured executor files.
The local archive is not yet public artifact hosting. Another machine must receive
the retained store explicitly; there is no invented URL or transparent network fallback.

## Prevention and verification

Lefthook checks exact staged bytes, not unstaged worktree lengths. CI's governance
target checks the committed change and small manifest, with no raw recording download.
The policy rejects new research blobs at least 1 MiB, ordinary blobs at least 5 MiB,
and reintroduction of any externally retained logical path even if its new bytes are small.
Synthetic controls check corruption, deduplication, missing objects, conflicting
destinations, traversal/symlinks, staged/worktree divergence and manifest-only checkout.

The migration control uses a real temporary Git repository: two unpublished commits,
an unchanged published base, preserved existing modifications/untracked files, identical
authors/dates/messages, removed raw paths throughout the rewritten range, and recovery
of the old raw recording from a verified bundle in an independent recovery repository.
Signed commits and non-linear unpublished histories refuse instead of losing identity.

## Unpublished history cleanup

The identified artifacts must first be removed from the current index only, with
physical bytes preserved and the implementation committed. Before any branch update,
the maintenance tool verifies the full external store and creates/verifies a recovery
bundle of the unpublished range. It removes only the 28 named paths from each tree,
preserves messages and author/committer identities/dates, and requires the rewritten
final source tree to be byte-identical to the committed pre-rewrite final tree.
Main advances through an atomic old-head comparison; there is no reset, stash,
checkout, push, public-history rewrite or unrelated working-file change.

The bundle and old→new mapping remain outside the repository, under
`migrations/<original-head>/`. Old IDs in retained evidence remain historical IDs;
their original commit contents are in that recovery archive. Routine bookkeeping
refreshes are automatic. Current D3262/D3512 search counts and holds do not change.

Final actual migration and normal verification measurements are appended after execution.

The first ordinary commit hook rejected a materialized index with missing raw roadmap
evidence. An initial manifest-linked reference approach passed, but the owner's intervention
correctly identified the underlying coupling: progress is not an artifact-availability check.
Removed that extension and all **47 raw-recording checkpoint dependencies**, retaining
existing compact reports, summary receipts and source/test anchors. Progress has no dependency
on the artifact manifest/store. Permanent controls reject compressed experiment payloads
and raw cost-detail files as progress evidence, even if physically present; absent ordinary
reports still refuse. Milestone states, completion gates and measured counts stay unchanged.

Future recordings can be retained before entering Git; their manifest and exact-path ignore
block update automatically. Verified working-copy eviction is separately tested and removes
only listed recoverable files, never archive objects or directory trees.
