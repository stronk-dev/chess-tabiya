# Return and progression — log

Append-only.

## 2026-08-13 — Codex start

- Independent adversarial review approved the RFC. Implementation starts after
  archived Defect Sweep and pack schema v0.5.
- Attempt identity is a run branch, not a checkpoint segment. Scheduling and
  metrics use the durable sibling projection and do not alter run events.
- Voluntary return is server-derived from schedule state; client-supplied
  origin is never trusted to decide the metric.
