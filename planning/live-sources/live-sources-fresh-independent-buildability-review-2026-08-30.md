# Live-sources Phase A — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** accepted `rfc/live-sources.md`, current import/API/web/storage boundaries and the
  returned Phase-B review
- **Verdict:** **RETURN TO AUTHOR / ACCEPTANCE WITHDRAWN**
- **Reproduction:** `make live-sources-fresh-review` — 9/9 findings
- **Production status:** no broadcast source, sanitizer, splitter, route member, migration or web
  selection journey exists; ordinary Lichess single-game import remains shipped

The real-PGN feasibility evidence and strip-before-storage direction survive. The accepted cut is
unsafe: it admits an ongoing broadcast board into ordinary import, whose shipped post-import pass
immediately enqueues engine evaluations, while Phase A deliberately has no liveness guard.

## B1 — “finished-only” is neither checked nor true ([[D2277]])

The title, summary and scope say finished-round ingestion. The same RFC then says ongoing boards
with `Result "*"` import as partial ordinary games. `resolveBroadcastSource` fetches only round PGN;
it never fetches or verifies round status. `importGame` unconditionally runs `#ensureStoryEvidence`
after storage. Therefore a pasted ongoing round URL reaches live engine analysis through the exact
unguarded path [[D411]] exists to prevent.

Phase A must either verify a trusted finished-round receipt and refuse every ongoing/unknown board,
or land only together with Phase B's exhaustive liveness guard. A `Result "*"` check alone is
insufficient because a terminal board in an ongoing delayed round remains live under the ruled
safe-side policy.

## B2 — the request and durable source vocabularies are falsely called server-local ([[D2278]])

The RFC says the `ImportSource` union crosses no package or schema boundary. It is hand-copied in
server parsing, server service types, web API types and the client form. `sourceKind` is also copied
through the SQL CHECK, storage interface, account export and web projection. Adding `broadcast` and
`lichess_broadcast` changes all of them.

Declare one versioned/shared request-result and durable source-kind authority, register its writers
and consumers, and make server/web compile against it. A migration CHECK plus copied string unions
is not one contract.

## B3 — board choice has no identity or result protocol ([[D2279]])

`board?: string` does not say whether the operand is game id, `GameURL`, board number or display
label. The refusal payload is prose—White/Black/Result—with no exact type, HTTP status, round
snapshot identity or stale-selection behavior. Board order and labels can change between the
choice response and retry.

Publish a stable normalized round/game identity, a closed `board_choice_required` result carrying
the source snapshot/digest and choices, and a retry command bound to those bytes. Cross duplicate
names, changed order, removed board, started-after-preview and round/game URL forms.

## B4 — the splitter proof only covers one friendly header shape ([[D2280]])

The disposable harness splits on a newline before `[Event `; the RFC describes a different
result-terminator/header algorithm; neither has hard negatives for reordered/missing Event tags,
`[Event ...]` text inside comments, CRLF, blank lines, header-only boards or adjacent ongoing `*`
games. Exact 10+10 fixture counts prove those two captures, not the declared PGN boundary grammar.

Use one parser-backed game framing authority or specify the byte grammar exactly, and add the hard
negatives before implementation. Every selected unit must still go through the sole legality
parser.

## B5 — the clock criterion tests the wrong grain ([[D2281]])

Production flow is split round → select one game → sanitize that game. Criterion 12 instead calls
`sanitizeBroadcastPgn` on the entire multi-game round and expects 902 readings. `ply` is per game,
so that result either conflates ten independent ply-zero origins or exercises a mode the product
never calls.

Assert exact per-game clock arrays after splitting, plus the aggregate 902 as a census. Define
missing, duplicate, malformed and revised readings through the `recorded-clocks` authority before
claiming the extraction contract complete.

## B6 — the external response has no resource budget ([[D2282]])

The 64 KiB cap applies only after a selected game is fetched, split and sanitized. The round body is
read whole with `response.text()`; 220 KB is merely one observation. No maximum bytes, games,
headers or per-game size protects memory/CPU, and no typed oversized-source refusal exists.

Add streamed byte/game/header bounds, abort behavior and boundary fixtures. The provider's 429
advice also needs an exact returned retry time; prose “back off ≥1 minute” has no actor in a
one-shot request.

## B7 — accepted dependencies and migration readiness are stale ([[D2283]])

The preamble calls `longitudinal-store` and `intent-presets` accepted; both are returned. The
migration is positioned behind returned `campaign-core`, so Phase A cannot currently land its
required CHECK rebuild. D410 is already closed for ordinary Lichess import, while D957/D958 now
have returned RFCs and D1272 answered the casting sequence.

Refresh the authority/dependency table and state explicitly that implementation waits on the
migration predecessor or an explicitly re-ruled position. Preserve the harness evidence; do not
preserve obsolete queue claims.

## B8 — non-Standard broadcasts have neither admission nor safe refusal ([[D2284]])

All 20 fixture games are Standard. The URL grammar otherwise accepts any public round. [[D1033]]
already records that Chess960 headers are refused, while a Chess960 header without FEN can be
silently interpreted from the standard start. Adding broadcast reach without a rules/setup
contract reproduces that known wrong-chess risk.

Consume the shared `rules + setupFamily` authority or explicitly refuse every non-Standard source
before import, including the missing-FEN case. Cross same-FEN/different-rules inputs.

## B9 — the existing web journey becomes false if the backend union alone widens ([[D2285]])

The form says “Lichess game URL,” sends only `pgn | lichess`, has no board picker, and promises the
original PGN is retained verbatim. Broadcast import requires a round/game distinction, a choice
round-trip and sanitized rather than verbatim stored bytes. A backend-only implementation would
make the accepted feature unreachable or make the disclosure false.

Specify the complete production application and browser contract in the same delivery unit: paste
URL, choose board, choose perspective, confirm sanitized-storage disclosure, import, and open the
story. Add keyboard/mobile/empty/error/provider-off cases. Discovery can remain Phase B, but the
Phase-A URL-paste journey cannot.

## Repair order

1. Decide the safe finished-only gate versus landing with Phase B; never ship the current bypass.
2. Register the shared source/request/result identities and exact board-choice protocol.
3. Repair splitter, per-game clock extraction and external resource-budget proofs.
4. Bind rules/setup and migration dependencies.
5. Specify and test the production REST + browser journey, then repeat independent review.

No implementation is authorized by this return.
