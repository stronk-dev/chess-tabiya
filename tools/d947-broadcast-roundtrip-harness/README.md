# d947-broadcast-roundtrip-harness

**Disposable research harness** (RFC-0000 §Exploration gate) — tied to ledger rows
**D414** ("No broadcast has been round-tripped through `pgn-import.ts`") and **D947**
(the owner-commissioned live-sources lane). Evidence instrument, not implementation;
delete freely once the `live-sources` RFC has consumed `roundtrip-output.md` and
`planning/live-sources/rfc-derivation.md`.

## What it does

Executes **real** Lichess broadcast PGN — a finished round and a mid-round ongoing
round from live tournaments — through the repo's actual import entry point
(`parsePgnMainline` in `apps/server/src/pgn-import.ts`), in both the bare and the
`importGame` (`requireMoves: true`) configurations, and writes the measured record to
`roundtrip-output.md`.

Run: `pnpm vitest run --config tools/d947-broadcast-roundtrip-harness/vitest.config.ts`

## Fixture provenance (fetched 2026-08-22, no auth)

| fixture | source | trim |
|---|---|---|
| `fixtures/finished-round-QxNfeqHA.pgn` | `GET https://lichess.org/api/broadcast/round/QxNfeqHA.pgn` — Campeonato de España Individual Absoluto y Femenino 2026, round 5, **finished** | first 10 of 45 games (220,266 → 50,286 bytes); annotation density preserved (972 `[%eval]`, 6 `Blunder.` verdicts remain in the trim) |
| `fixtures/ongoing-round-wDTQF08K.pgn` | `GET https://lichess.org/api/broadcast/round/wDTQF08K.pgn` — XXVII Open Internacional de Sants 2026 Group A, round 2, **ongoing at fetch time** | games 17–26 of 26 (42,474 → 16,090 bytes), keeping 9 in-progress `*` games and the round's one finished game (a 1-ply forfeit) |

Round IDs came from `GET https://lichess.org/api/broadcast` (NDJSON index, 56,446
bytes, `nb=20` tours): at sample time it listed 10 finished and 10 ongoing rounds.

## Endpoint latency (measured 2026-08-22, sequential requests per Lichess rate policy)

| endpoint | samples | TTFB | total |
|---|---|---|---|
| `GET /api/broadcast` (index, NDJSON) | 3 | 0.140–0.165 s | 1.12–1.18 s |
| `GET /api/broadcast/round/QxNfeqHA.pgn` (finished, 45 games, 220 KB) | 3 | 0.135–0.154 s | **4.57 s** (body is streamed out slowly; byte-identical across samples) |
| `GET /api/broadcast/round/wDTQF08K.pgn` (ongoing, 26 games, 42 KB) | 1 | 0.243 s | 2.77 s |
| `GET /api/stream/broadcast/round/wDTQF08K.pgn` | 1 (6 s cap) | 0.240 s | held open; **all 26 games (42,672 bytes) arrived in the first burst**, then silence until a move updates a game |

The streaming variant's documented contract (Lichess API docs: it "first sends all
games of a broadcast round in PGN format", then re-sends a game's full PGN whenever
it updates — "the best way to get updates about an ongoing tournament") matched the
sample; polling the plain round endpoint is the documented-inefficient alternative.

## Headline result

Every one of the 20 real broadcast games parsed through `parsePgnMainline` — see
`roundtrip-output.md` for the per-game record, the multi-game refusal, the
annotation-dropping behavior (D410), and the `*`/zero-move edge cases.
