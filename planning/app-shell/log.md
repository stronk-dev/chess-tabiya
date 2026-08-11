# app-shell — log (append-only)

## 2026-08-11 (claude, setup)

- RFC accepted after adversarial review (AS-C1..C8 resolved in-draft; no owner
  rulings needed). Key corrections from review: this is a shell-layer rewrite
  (no router exists), storage cannot list and the repo has no migration
  mechanism while compose mounts a persistent volume, lease visibility was
  unimplementable without a non-minting peek, and the keymap would have
  double-fired against DrillScreen's window handler.
- Router decision: hand-rolled, no new dependency (deferred-decisions register).
- Next: codex session 1 → §1 storage listing + migration.
