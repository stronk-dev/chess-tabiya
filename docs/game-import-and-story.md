# Game import and story

Tabiya can turn one explicitly chosen historical game into a rehearsal run. The
learner pastes one PGN or supplies one public lichess game URL, selects their side
and resistance, and receives a grounded story whose moments open back into live
play. This is optional entry context, not account linking, bulk history mining, or
the product's required starting point.

## Imported runs

`imported` is a third run session kind beside `pack` and `position`. It is a
non-pack, `attempt_end` session: `packId` and `packDigest` are null and
`theory_strict` is unavailable. Its session identity includes a SHA-256 digest of
the canonical root FEN and complete UCI movetext, so two different games starting
from the same position do not collapse into one identity.

Import accepts exactly one standard, mainline-only PGN with at least one move and
at most 300 plies. `SetUp`/`FEN` headers are honoured, every SAN move is replayed
legally through the shared chessops parser, and both players' historical moves are
stored as actor plies. No opponent-selection event or engine identity is invented
for moves that came from the PGN.

The imported primary mainline is immutable at its tip. Both learner-move and opponent-move
endpoints refuse to extend it; the learner rewinds first, and the ordinary runtime then creates a
rehearsal branch. This preserves the source record while keeping every historical position
playable.

The sources are deliberately narrow:

- pasted PGN is retained verbatim;
- a public `https://lichess.org/<game-id>` URL is fetched without credentials,
  serially, with a bounded timeout and server evaluations disabled;
- chess.com URLs are refused with guidance to paste the PGN because no supported
  per-game public fetch contract exists.

`POST /runs/import` creates the run and its provenance record atomically. Unknown
request fields fail explicitly. `GET /runs/:id/import` returns the authorized
record: source kind/URL, movetext digest, PGN headers, result, original PGN,
licence note, and import time. Imported runs appear in history but do not create
attempt, schedule, progress, or position-statistic rows.

Migration 12 creates `imported_games`, advances storage 11→12, and stamps existing
run snapshots from schema 0.9 to 0.10 using frozen version literals.

## Results and evidence

A historical result and a chess-terminal result are separate facts. Checkmate or
a runtime-provable draw emits the normal learner-relative `outcome.reached` event.
A resignation, agreement, or flag remains only the PGN's recorded result; the
server never fabricates a terminal event for a playable board. `Result "*"` is
reported as unfinished.

After persistence, the server enqueues one evaluation job per mainline node,
including the root. An 80-ply game therefore requests 81 jobs; the 300-ply import
cap bounds the pass at 301. The pass is idempotent-completing: story reads inspect
durable evaluations plus current queue state and enqueue only missing nodes.
Process loss or rewind cancellation can delay work but cannot permanently wedge the
story.

Evidence remains single-writer. Story reads never apply staged results or acquire a
lease; the active writer uses the normal evidence endpoint while delivery is open.
Until every mainline node has durable evaluation or a current recorded failure, the
story says how many positions remain and disables re-entry.

## Grounded moments

`GET /runs/:id/story` is an authorized, disclosure-gated derived projection. Imported
mainlines qualify under this contract; native pack and position branches qualify after a
validated terminal outcome. It
combines persisted run/evidence data with shipped deterministic detectors:

- irreversible moves, phase changes, sustained option collapse;
- recorded evaluation pivots and the last near-level moment in a recorded loss;
- first endgame entry and attributed technique census;
- reusable-shape spans; and
- board-terminal outcome or the PGN's attributed recorded result.

Evaluation moments use a documented product convention: mate maps to a ±1000 cp
rail, scores are learner-relative, and a consecutive swing of at least 150 cp is a
pivot. These are arithmetic over recorded engine evidence, not move grades. An
imported mainline has no human-model divergence because no selection distribution
was recorded there.

Every moment contains deterministic attributed sentences, FEN, ply/SAN, phase,
and separate `nodeId` and `entryNodeId`. A terminal fact stays grounded at its
terminal node but enters its playable parent. The payload returns all moments plus
a deterministic rank. One shared reducer selects the ranked eight for both the
private and public story, then restores game chronology for display; sharing can
therefore neither omit a reviewed moment nor promote an unrelated early moment.
Optional story voice uses the existing evidence-packet checker and deterministic
fallback. It may phrase the packet but cannot add chess claims.

The selected moment shows the grounding sources resolved from its admitted evidence
and the manifest's derivation chain. The downloadable card carries every admitted
sentence rather than silently retaining only the first, lists those same sources,
and grows vertically for a longer packet instead of clipping it. It never labels a
rules or authored-catalogue fact as engine analysis.

## Re-entry and export

The story is not a read-only review. Selecting a moment claims the run's writer
lease for the current device, rewinds to its `entryNodeId`, and explicitly creates
a `story-reentry` branch before opening the run screen. Creating the branch
immediately preserves the imported continuation even when the selected moment is
the original leaf; claiming the lease makes the primary action work when the story
is opened on a different device. The learner then plays through
the ordinary opponent, evidence, structural-reading, rewind, comparison, and
branch-group machinery.

Imported-run PGN export defaults to all branches. It retains Tabiya's run/session
headers, restores the original White, Black, Date, and Result, records the original
Event/Site as `SourceEvent`/`SourceSite`, and writes rehearsal branches as legal PGN
variations with their `Tabiya branch` comments.

The client surfaces are an import form on `/review`, the story at
`/review/game/:runId`, a Story control on imported run screens, and export from the
story. Boards use the learner's declared orientation. Re-entry is browser-tested
end to end: paste, derive, reveal, select, branch, play, and export.

## Limits

- No account linking, automatic history import, background fetch, weakness model,
  variants, or third-party engine annotations.
- No chess.com URL fetch; PGN paste is the supported path.
- The evidence queue remains process-local. Durable evidence makes completion
  convergent, but an interrupted pass may repeat bounded work.
- Native terminal story offers, story-card image rendering, and revocable public
  share-card hosting are documented in `adoption-wave-1.md`.
