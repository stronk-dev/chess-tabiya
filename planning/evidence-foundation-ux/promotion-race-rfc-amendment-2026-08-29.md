# Promotion-race RFC amendment receipt

**Date:** 2026-08-29

**RFC:** `rfc/semantic-collectors.md` §3.7

**Rows:** D963, D1699, D1700

**State:** author repair complete; fresh independent review required; production unchanged

## Why the accepted text could not implement

The accepted §3.7 predated `design/research/promotion-race-contract-closure.md`. Its geometry
constructor accepted raw FEN and described a path as “capturable” without consuming the complete
pawn-contact authority. Its outcome constructor accepted a tablebase category from any position
with the same piece count and recomputed legal promotion moves privately. Both paths had executable
false positives in `tools/d1699-promotion-race-contract-harness/`.

## Repaired contract

- Geometry has one input: a sealed `rules.pawn.reading.contacts@1` item. Every participant joins an
  exact `passed: true` row by color, square and pawn role. The measured a2/b7 false race abstains;
  the a2/h7 9/10 arrival positive survives.
- The old `blocked_or_capturable_path_outside_convention` reason is withdrawn in favor of
  `no_opposing_passed_clear_paths`. The convention does not claim arbitrary-piece safety.
- Outcome has exactly two three-input derivation alternatives: geometry + exact legal moves + one
  recorded tablebase result, or the same local inputs + one live Syzygy position delivery.
- All three inputs carry byte-equal canonical full FEN. Piece-count equality is not position
  identity. Only the tablebase input supplies outcome; provider absence, local outside-domain and
  input absence remain distinct.
- Projection-effective execution and the live source are consumed from
  `provider-exchange-and-execution`; this RFC cannot create a pawn-private source or flatten the
  recorded/live paths into a producer-wide latency label.

## Verification boundary

The disposable D1699/D1700 harness now carries the amended abstention vocabulary. The RFC adds
C16 and strengthens C2/C5/C8/C9/C14 so declared-item forgery, missing legal input, cross-FEN,
cross-source and provider-flattening paths fail.

No runtime, provider, schema, pack or content byte changed. Geometry may implement only after a
fresh independent review accepts this amendment. Outcome additionally waits for the provider RFC's
fresh acceptance and implementation.
