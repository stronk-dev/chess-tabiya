# Polish surfaces — implementation log

## 2026-08-14 — Codex review

Approved for implementation after checking the current assistance type and
migration, capability registry, run-action parser, disclosure predicate,
voice packet path, and Chessground configuration. The external TTS path is
implemented independently of an LLM provider: when no voice provider is
configured it synthesizes the deterministic evidence-packet sentences. This
is the RFC's stated deterministic fallback, not a new provider dependency.

## 2026-08-14 — Implementation and closeout

Implemented AssistanceConfig v4 and local migration, real per-context settings,
disclosure-capped structural board forms, compact run regions, responsive live
surfaces, the install manifest, ambient presence, and a packet-bound TTS seam.
The browser test exposed six pixels of document overflow at 390×844; fixing the
root to the compact viewport closed it without retries. Canonical behavior was
folded into `docs/app-shell.md` and `docs/adaptive-guidance.md` because this is
an extension of those two shipped systems, not a standalone subsystem.

Verification before archival: `ENGINES_REQUIRED=1 make verify` green at 462
tests / 77 files; targeted mobile browser acceptance green. Full browser gate
is rerun after the lifecycle moves.
