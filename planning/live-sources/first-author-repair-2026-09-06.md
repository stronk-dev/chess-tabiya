# Live-sources Phase A — first author repair

- **Date:** 2026-09-06
- **Input:** [[D2277]]–[[D2285]], the 2026-08-30 fresh return, current code/register state,
  and `design/research/live-source-finished-receipt.md`
- **Verdict:** all nine returned obligations are incorporated at contract tier; another genuinely
  fresh independent review is required; no implementation is authorized
- **Reproduction:** `make live-sources-author-repair`

## Repairs

| row | repaired contract |
|---|---|
| D2277 | current `finishedAt` authority brackets the PGN read; ongoing/unknown/changed sources refuse before import or evidence |
| D2278 | one absent `import-source-protocol` register root plus this RFC's exact future first-lane-1 whole projection owns request/result/source vocabulary; the claim remains non-live until the descriptor lands |
| D2279 | stable round/game ids, normalized observation digest, closed choice payload, stale-selection retry and a durable typed finished receipt |
| D2280 | `chessops` parser-backed framing with the full adversarial fixture list; legality remains `parsePgnMainline` |
| D2281 | per-selected-game lossless `{gameId,ply,occurrence,raw}` clock tokens; exact 10-game vector sums to the 902 census and includes zero |
| D2282 | bounded streamed JSON/PGN bodies, game/header limits, typed refusal, abort and exact boundary cases |
| D2283 | returned RFCs are not called dependencies; bootstrap/register and real migration predecessor block implementation |
| D2284 | Phase A admits only explicit Standard/from-standard-start and refuses every unknown/non-Standard setup |
| D2285 | production REST/client/browser URL→choice→perspective→disclosure→Story journey, recovery, keyboard and mobile are one delivery unit |

## Historical-return retention

The 2026-08-30 defect reproducer previously read the live RFC, so repairing the document made the
historical test fail by deleting the defect it expected. It now reads exact commit `ab246e75` for
all reviewed inputs. `recorded-clocks`' dependent return pins its live-sources input to the same
commit. This is not weakening: both tests still reproduce the exact returned bytes, while this
repair has a separate positive harness.

## Honest limits

Lichess exposes no immutable revision joining its round JSON and PGN export. The receipt therefore
asserts only an observed-finished interval and records the captured digests; it never claims an
atomic or permanently finished upstream snapshot. `Last-Modified` is advisory provenance only.

The author repair creates no runtime protocol, route, migration or UI. Acceptance still requires a
fresh review, owner disposition of [[D412]], the generic bootstrap, the absent-root register and the
migration predecessor. Implementation closes D2277–D2285; this document does not.

The finished receipt is deliberately a structured nullable record field, not text appended to the
licence note. The migration binds receipt presence to `lichess_broadcast`, hydration validates it,
and account archive round-trips its exact fields. The PGN request also sets `comments=false` while
retaining `clocks=true`; the sanitizer and residue assertion remain the required trust boundary.
