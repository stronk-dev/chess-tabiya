# On-ramp guard implementation log

## 2026-08-14 — Codex review and start

Adversarial review against the post-migration-15 tree found no design blocker. It pinned four
integration details before code: widen the explicit `PackRun` policy union; update both run-schema
policy enums; abstain on opponent-first root plies with no learner decision; and correct the
§1c migration heading from 15 to 16. The engine-evidence pair can be completed when either
recorded endpoint is applied, using the existing job-derived `engine:` reference.

Tooling deliberately not added: no out-of-band engine evaluation, polling loop, new evidence
reference, endpoint, table, or event type. Those would change the RFC's timing or honesty contract.
