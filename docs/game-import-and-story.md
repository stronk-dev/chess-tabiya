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

Before submission, the client states the durable-storage boundary: the original
PGN is kept verbatim, including player names, tags, comments, and move
annotations, beside the parsed main line and any rehearsal branches added later.
It also states that these bytes are included in account export and removed with
the imported run or account, subject to the documented backup limits. Chess.com
guidance asks for one completed-game export, not an analysis tree containing
variations.

The server remains the authority for parsing and source lookup. The client maps
the server's typed refusals to distinct, actionable messages for one-game,
mainline-only, variant, size, length, empty-game, starting-position,
illegal-move, parse, lookup, timeout, and unsupported-source failures. An
unrecognised typed failure retains the server message rather than being replaced
with a generic alert.

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

The review header keeps the two forms apart. A recorded PGN result is stated as recorded
(`Recorded result: 1-0.`) — it does not assert that the historic player is the learner
(rfc/review-map.md §8) — and a board-terminal result is stated for the declared side (`Result on the
board: loss for White.`); an unfinished line says that it has no recorded result.

The learner-facing surface for both forms is the Review Map (below). On desktop it lays out the
move list, the selected-position board with its evidence panel, and the moment cards as three
columns; on narrow screens the same regions stack into the route's normal vertical reading order.

After persistence, the server enqueues one evaluation job per mainline node,
including the root. An 80-ply game therefore requests 81 jobs; the 300-ply import
cap bounds the pass at 301. The pass is idempotent-completing: story reads inspect
durable evaluations plus current queue state and enqueue only missing nodes.
Process loss or rewind cancellation can delay work but cannot permanently wedge the
story.

Evidence remains single-writer. Story reads never apply staged results or acquire a
lease; the active writer uses the normal evidence endpoint while delivery is open.
Until every mainline node has durable evaluation or a current recorded failure, the
review says how many positions remain; grades and accuracy stay coverage-gated meanwhile.

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
a deterministic rank. The Review Map's single selector (`selectReviewMoments`) walks that rank and
keeps at most three moments, one per represented phase, then restores game chronology. The private
review, the public share and the downloadable card all read that one selection, so their moment ids
and order are byte-identical; each states the denominator of admitted story moments.
An irreversibility-only marker is the selector's final family. If that same moment also carries a
stronger grounded signal such as an outcome or evaluation pivot, the stronger family still decides
selection. Irreversibility remains available as evidence, but its high-volume marker cannot crowd a
shape, phase, outcome, or other recorded moment out of the bounded Story.
The client never presents this internal selection order as a rank: cards appear in game chronology
without position numbers, and the region permanently states that these are moments the game review
can explain rather than a ranking of the learner's play. No copy claims educational value.
Optional story voice uses the existing evidence-packet checker and deterministic
fallback. It may phrase the packet but cannot add chess claims.

The selected moment shows the grounding sources resolved from its admitted evidence
and the manifest's derivation chain. The downloadable card carries every admitted
sentence rather than silently retaining only the first, lists those same sources,
and grows vertically for a longer packet instead of clipping it. It never labels a
rules or authored-catalogue fact as engine analysis.

## Re-entry and export

The review is not read-only. `Retry from here` — on every move-list row (entering the position
before that move) and on every moment card (entering its `entryNodeId`) — claims the run's writer
lease for the current device, rewinds to the entry node, and explicitly creates
a `story-reentry` branch before opening the run screen. Creating the branch
immediately preserves the imported continuation even when the selected moment is
the original leaf; claiming the lease makes the primary action work when the story
is opened on a different device. The learner then plays through
the ordinary opponent, evidence, structural-reading, rewind, comparison, and
branch-group machinery.

That three-stage action owns one retained subject. The client observes a provisional writer
without storing it, persists that writer only after the server confirms the lease, and validates
that both the rewind and the new `story-reentry` branch describe the requested run and entry node.
A response completing after the learner leaves the review may finish the requested server mutation,
but it cannot navigate from the learner's newer route. Lease rejection leaves no local writer claim.
A viewer without write access sees every Retry control disabled with its stated reason, and a failed
attempt (another learner holds the board, access denied, anything else) renders its reason beside
the control instead of throwing.

The action is learner-facing “Retry from here”; `story-reentry` remains an internal branch kind
rather than interface vocabulary.

Imported-run PGN export defaults to all branches. It retains Tabiya's run/session
headers, restores the original White, Black, Date, and Result, records the original
Event/Site as `SourceEvent`/`SourceSite`, and writes rehearsal branches as legal PGN
variations with their `Tabiya branch` comments.

The client surfaces are an import form on `/review`, the story at
`/review/game/:runId`, a Story control on imported run screens, and export from the
run or Library. Import currently admits Standard and From Position games only. The
raw Variant allow-list runs before chessops constructs a position, so an explicit
Chess960 PGN—with or without setup FEN—refuses without persisting a run; rules-aware
variant support remains a separate contract.

The Review import form owns the storage and Story-preparation phases separately. It
captures the submitted source, side, route generation, run id, and provisional writer
identity before the request; disables duplicate submissions while either phase is in
flight; and persists the writer claim only after the server confirms the imported run.
If Story preparation fails after storage, Review says that the game is already saved
and retries only preparation for that run, so retry cannot create a duplicate import.
A response that completes after the learner leaves Review may finish server work but
cannot navigate, clear newer form input, or publish its error into another route.
Provider and storage diagnostics never become learner-facing copy.

Boards use the learner's declared orientation. Re-entry is browser-tested
end to end: paste, derive, reveal, select, branch, play, and export.

## Review Map

`GET /runs/:id/review` (rfc/review-map.md) is the whole-game Review Map for the same branch the
story reads, rendered at `/review/game/:runId` by `ReviewMapScreen`. It is a read-only, recomputed
projection (`reviewMapProjection` in `packages/runtime/src/review-map.ts`): the read enqueues no
evaluation job, writes no event and persists no grade.

- **Move list.** Every ply of the line, with number, SAN and side. SAN is regenerated from the
  legal move, so third-party annotation glyphs, NAGs and comments in a pasted PGN (which the import
  record keeps verbatim) never reach this surface.
- **Grades.** Each move is graded from the mover's side by the `derived.grade.move_quality@1`
  producer — the shipped grader's only production caller — on the `report` ladder (context
  `imported_analysis` for imports, `review` for native runs) from the two recorded evaluations
  around the move, compared only when engine and requested search limit match. Below threshold
  nothing is emitted, so most rows carry no chip, and a chip is always the complete grounding
  sentence: both evaluations, the drop, the threshold and `grade-convention@1/<context>`.
- **Accuracy.** Per side, `100 − mean(max(0, dropWinPercent))` over that side's decisions through
  the one exported `winPercentFromCp`. It renders only when every decision of that side has paired
  recorded evaluations; otherwise it abstains and states the evaluated fraction.
- **Moments.** Up to three, one per represented phase, from the story rank; zero is a stated outcome.
- **Evidence panel.** For the selected move: the grade (or why there is none), the recorded
  evaluation with its engine and search limit, any story sentences at that node, and the detectors
  the recorded-semantic-path compiler fired from that move (its first production consumer). The
  per-position review packet of the draft `review-evidence-compiler` is shown as an explicit
  abstention.
- **Eval graph.** One point per ply over the durable evaluations (`evalGraph`), with the accuracy
  figure's coverage gate: a position counts only when its recorded packet reads as a grade operand.
  Recorded evaluations are White-perspective; points are drawn as win-points for the review's side
  (the run's start side, i.e. the importer's colour), through the same logistic. Where readings are
  missing — the native-run case — the graph draws no line across the stretch, shades it, and states
  each gap in words, plus a coverage sentence. Every ply is a keyboard stop (one tab stop, arrow
  keys/Home/End between points) that selects the move in the list; a text list mirrors every point.
- **Compare handoff.** `compareDoors` lists, per reviewed position, the other recorded lines that
  leave the reviewed line there and carry at least one move of their own (a retry that has been
  played), reviewed line first, capped at the shipped compare's eight columns. The row (and moment
  card) at that position offers *Compare lines from here*, which opens the run with the shipped N-way
  compare on exactly those branch ids; no comparison machinery is added.
- **Analyze.** An explicit, secondary action under the evidence panel. `GET
  /runs/:id/review-analysis?node=<nodeId>` (read-only, like the review) returns the recorded engine
  line from the position before that move — a `bestline` packet's principal variation, else the
  eval packet's recorded search first move — as one template sentence naming the engine and the
  requested search bound, plus a caveat that it is not advice. A line without its search bound is not
  shown. The reveal closes when the selection moves or a retry starts, and it is **withheld** (server
  and client) for the position a retry is open from: the run's active line leaves the reviewed line
  there and has reached no outcome (`openRetryEntryNodeId`).
- **Prose.** Every authored string is a registered template (`REVIEW_MAP_TEMPLATES`); none carries a
  judgement word. The footer names the grounding sources of the admitted items actually on the page.
  No best move, principal variation or praise class appears in the ordinary map; an engine line
  appears only under Analyze.

`voiceCheck` enforces licence-by-span for judgement words ([[D1409]]): a judgement word is valid only
inside a byte-exact grounding sentence of the rendered view, never elsewhere in the output. Squares,
moves, chess nouns and prescriptive verbs remain packet-relative pending [[D1419]]'s follow-up.

## Limits

- No account linking, automatic history import, background fetch, weakness model,
  variants, or third-party engine annotations.
- No chess.com URL fetch; PGN paste is the supported path.
- Story evidence is admitted as durable batches (≤16 jobs, keyed by branch, terminal node and
  chunk); an interrupted pass resumes after restart instead of repeating work.
- Native terminal story offers, story-card image rendering, and revocable public
  share-card hosting are documented in `adoption-wave-1.md`.
