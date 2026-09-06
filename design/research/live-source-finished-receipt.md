# Finished Lichess broadcast receipt — current authority and limits

- **Measured:** 2026-09-06
- **Question:** can `live-sources` Phase A prove that the imported snapshot is from a
  finished round without depending on PGN `Result` alone or on Phase B's live lock?
- **Feeds:** [[D2277]], [[D2279]], [[D2282]], `rfc/live-sources.md`
- **Method:** current official Lichess OpenAPI source plus unauthenticated one-at-a-time
  probes of the public index, one finished round and one ongoing round. No production
  code or account state was changed.

## 1. The current completion authority

The official round-info schema exposes `round.finishedAt` and marks the older boolean
`round.finished` **deprecated: use `finishedAt` instead**. `round.ongoing` remains a
separate optional boolean. `[V]`

- <https://github.com/lichess-org/api/blob/master/doc/specs/schemas/BroadcastRoundInfo.yaml>

The official round-detail operation returns a `BroadcastRound` containing `round` and
`games`; each game has a stable eight-character `id` and an optional result-like
`status` from `* | 1-0 | 0-1 | ½-½`. `[V]`

- <https://github.com/lichess-org/api/blob/master/doc/specs/tags/broadcasts/api-broadcast-broadcastTournamentSlug-broadcastRoundSlug-broadcastRoundId.yaml>
- <https://github.com/lichess-org/api/blob/master/doc/specs/schemas/BroadcastRound.yaml>
- <https://github.com/lichess-org/api/blob/master/doc/specs/schemas/BroadcastRoundGame.yaml>

The public index describes `live=true` as rounds that are started and not finished.
Its default response deliberately mixes active rounds with recently finished rounds.
On 2026-09-06, an unauthenticated `GET /api/broadcast?nb=3` returned all three states:
future rounds with neither flag, an ongoing round with `ongoing:true`, and finished
rounds with both `finishedAt` and the deprecated `finished:true`. `[V]`

- <https://github.com/lichess-org/api/blob/master/doc/specs/tags/broadcasts/api-broadcasts-official.yaml>

A same-pass unauthenticated round-detail probe returned a finished round
`nk1hZDnj` with `finishedAt:1788606164457` and six terminal game statuses. An ongoing
round `mZERjD5N` returned `ongoing:true`, no `finishedAt`, and six `*` statuses. These
are observations, not permanent fixtures: their value is confirmation that the
documented fields are present on the public path the product would call. `[V]`

## 2. Why a terminal PGN is not a finished receipt

The PGN-export operation only promises the current PGN representation of every game
in the round. It also explicitly points live consumers to a separate stream that emits
the whole changed game whenever a move arrives. Neither operation says that a terminal
`Result` proves the round is finished. `[V]`

- <https://github.com/lichess-org/api/blob/master/doc/specs/tags/broadcasts/api-broadcast-round-broadcastRoundId-pgn.yaml>
- <https://github.com/lichess-org/api/blob/master/doc/specs/tags/broadcasts/api-stream-broadcast-round-broadcastRoundId-pgn.yaml>

The official API also exposes a write-authorized **reset round** operation that removes
all games and returns the round to its initial state. Therefore `finishedAt` is an
upstream state observation, not an immutable lifetime fact. `[V]`

- <https://github.com/lichess-org/api/blob/master/doc/specs/tags/broadcasts/broadcast-round-broadcastRoundId-reset.yaml>

`DESIGN-GAP:` the withdrawn RFC called a board from an ongoing round importable and
then relied on Phase B to make it live. That contradicts its own Phase-A finished-only
scope and reaches the shipped automatic Story evidence enqueue. The repair must refuse
unknown/future/ongoing round state and must treat a selected board's terminal status as
an additional check, never the round-completion authority. `[V]` —
`planning/live-sources/live-sources-fresh-independent-buildability-review-2026-08-30.md`
§B1.

## 3. What can and cannot be bound

The current public responses expose no shared immutable revision joining the JSON
round detail to the PGN export. In the live probe, the JSON response exposed neither
`ETag` nor `Last-Modified`; the PGN response exposed `Last-Modified` but no `ETag`.
The official schemas promise no revision field on either representation. `[V]`

Consequently an RFC must not claim an atomic upstream snapshot. The strongest honest
Phase-A proof available is a **bounded observed-finished receipt** over one serialized
read interval: `[M]`

1. normalize and retain the round id from the URL;
2. read round detail and require the exact same id, present `finishedAt`, absent or
   false `ongoing`, and a selected game with a terminal status;
3. fetch the bounded round PGN and bind its SHA-256 digest;
4. read round detail again and require byte-equal normalized round/game identity,
   `finishedAt`, selected-game status, and still no live state;
5. bind the selected PGN unit by exact `GameURL` game id, its result, the whole-round
   digest, the sanitized selected-game digest, both observation digests and timestamps.

This proves what the product needs: Lichess declared the same selected game and round
finished immediately before and after the captured PGN. It does **not** claim the
organizer can never reset or edit the round later. Once imported, the record is the
captured immutable copy; a later upstream change does not retroactively turn it into a
followed game. `[M]`

`Last-Modified` may be recorded as advisory provenance, but cannot be the receipt's
identity: it is optional, only the PGN response exposed it in the measured pair, and
the API does not promise that it joins the JSON representation. `[V]`/`[M]`

## 4. Board identity and refusal semantics

The existing real fixtures already carry a `GameURL` ending in the same eight-character
game identity used by the JSON `games[].id`; duplicate player names or changing display
order therefore do not need to be identity. `[V]` —
`tools/d947-broadcast-roundtrip-harness/fixtures/finished-round-QxNfeqHA.pgn`.

The Phase-A choice protocol should expose only stable operands: normalized round id,
round-observation digest, game id, player display fields, result status and current
order as presentation metadata. Retry must return `BROADCAST_SELECTION_STALE` with a
fresh closed choice payload when the supplied round-observation digest is no longer
current or the chosen game identity/result is absent or changed. `[M]`

Unknown completion state, `ongoing:true`, missing selected-game status, `status:"*"`,
missing/mismatched `GameURL`, a changed second observation, or an over-budget response
all refuse before `importGame`; none may create a record or enqueue evidence. `[M]`

## 5. Verdict

**Phase A can remain separate from Phase B.** The current API provides enough public
authority for a conservative observed-finished receipt, but not for the old one-fetch
contract and not for a claim of atomic or permanent upstream completion. D2277 is
therefore an author repair, not a reason to merge live following into the import unit.
`[V]`/`[M]`

Residuals: the exact response budgets, parser-backed multi-game framing, per-game clock
grain, rules/setup admission, shared request/source resource and complete browser
journey remain the independent return's D2278–D2285 work. This pass answers only the
external-authority question needed to repair D2277 and the status half of D2279.
