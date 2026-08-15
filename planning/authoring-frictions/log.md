# Authoring frictions implementation log

Append-only.

## 2026-08-15 — implementation opened (codex)

- Re-read the full RFC, including the post-review §8 correction.
- Opened the lifecycle at pack schema 0.16 with no migration and no run-schema change.
- Preserved the load-bearing correction: `rules_fact: draw` must widen both the pack schema and `RULES_EVIDENCE_FACTS`, with a compile/play regression.
