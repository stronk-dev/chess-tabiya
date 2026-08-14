# Adoption Wave 1 log

## 2026-08-14 — Codex review and start

Approved after pinning native-story identity and server-minted flip ids, correcting
migration 13 and rebasing the baseline/dependency on the archived corpus lifecycle.
Implementation starts at storage 12 with 424 tests / 72 files and 17 zero-retry
browser tests green.

## 2026-08-14 — Codex implementation

Implemented migration 13, native terminal stories, deterministic titles,
hashed and revocable anonymous story cards, the external HTTP voice adapter,
AssistanceConfig v3 spoken delivery, derived milestones, and atomic
opposite-side runs. The browser composition adds terminal story/flip controls,
the public card and PNG download, milestone and derivation links, and speech
only when the learner opens an assistance surface.

Exercising coverage includes typed refusal without evidence enqueue,
path-scoped human divergence, exact public projection/hash/revocation,
provider transport and timeout fallback, source-preserving flip, v1/v2
preference upgrades, and zero-retry browser flows. Pre-closeout gates:
`ENGINES_REQUIRED=1 make verify` green at 430 tests / 73 files; `make
test-browser` green at 18 ordinary tests with the optional Maia measurement
skipped. No authored chess vocabulary or claim was added.
