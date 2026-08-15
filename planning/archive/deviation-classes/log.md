# Deviation classes log

## 2026-08-15 — codex implementation

- Review approved the rewritten multi-valued design. `mistake` is a set; `cost` remains explicitly author-declared and unbacked.
- Added pack schema v0.21 and the end-to-end theory-verdict projection. The deviation-note item and voice packet remain deliberately unchanged.
- Guard overrides now resolve by `(path depth, move scope)`, with a matching move-scoped override beating an earlier unscoped override at equal depth.
- Evidence refusal covers both `/deviations/i/mistake` and `/deviations/i/mistake/j`; the latter prevents an array-element grounding bypass.
- Runtime validation warns about internally unreachable declared costs and refuses illegal move scopes or invalid timing-window links without consulting an engine.

## 2026-08-15 — completion

- `ENGINES_REQUIRED=1 make verify` passed with 557 tests across 90 files.
- Browser acceptance passed 24 tests at zero retries; the optional Maia latency case remained skipped.
- Canonical behavior is reconciled in `docs/drill-pack-format.md` and `docs/drill-client.md`; the RFC and planning job are archived.
