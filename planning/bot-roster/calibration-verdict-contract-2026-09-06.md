# Bot-roster calibration verdict research receipt

**Date:** 2026-09-06
**Rows:** [[D2236]], with executable inputs for [[D2234]], [[D2235]] and [[D2237]]
**Result:** exploration gate answered; no bot result or RFC acceptance claimed

## Landed

- `design/research/bot-calibration-verdict-contract.md`
- `tools/d2236-bot-calibration-verdict-contract/manifest.json`
- executable manifest/verdict model and nine able-to-fail tests
- `make bot-calibration-verdict-contract`

## What changed

The calibration plan no longer asks prose to decide whether a result “looks human.” One manifest
owns 17 arms / 13,200 games, the already-measured June CC0 source, 24,000 human decisions, one
complete typed Stockfish authority, four statistics and Holm multiplicity. Relative strength,
distribution equivalence and rating-band identity are separate results. A guard-caused mismatch is
representable as disclosed controlled divergence but can never grant the human-like label.

## Still open

1. Amend `rfc/bot-roster.md` on [[D2234]]–[[D2237]] and consume the manifest instead of copying it.
2. Keep [[D2233]] dependency-blocked until the repaired bot-policy contract survives a genuinely
   fresh review.
3. Build the human-reference evaluator and 13,200-game runner only after the RFC is accepted.
4. No current profile has passed the new contract.
