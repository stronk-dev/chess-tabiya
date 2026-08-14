# Shape library implementation log

Append-only.

## 2026-08-14 — Codex adversarial review

Approved after two integration corrections. The RFC's sample type would have made the schema
package import runtime even though runtime already imports schema; shape entries now reuse the
schema-owned structural-expression type while runtime remains the evaluator. The new HTTP surface
also needed explicit admission to the closed server-error and application API-path dispatches so
missing shapes return 404 and `/shapes` cannot fall through to the SPA.

The derived-projection decision, referenced-only firing inside packs, no-event disclosure
invariant, position-run selector reconstruction, and version/migration baselines all match the
current tree. Implementation will materialize only the RFC's already-authored entries and retain
their provenance warnings; it will not invent additional chess claims.
