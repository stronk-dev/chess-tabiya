# Concept registry — second author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2709]], [[D2710]], [[D2711]], [[D2712]], [[D2713]], [[D2714]], [[D2715]],
  [[D2716]]
- **Gate:** `make concept-registry-second-author-repair` — retained 21 predecessor controls, new
  8/8
- **Disposition:** requirements-only repair; another genuinely fresh review remains mandatory

## Repair

Registry revision and ref identity is now byte-exact. One duplicate-key-refusing parser owns exact
keys, canonical bytes, UTF-8 byte ceilings and Unicode-scalar validity. A resolved ref is a parsed,
copied and recursively sealed value; caller mutation cannot rewrite historical identity.

Migration authority moved into storage. The operation no longer accepts caller pack, attempt, run
or occurrence objects. One `BEGIN IMMEDIATE` transaction reads the stored concept population joined
to attempts and run snapshots, reconstructs each occurrence, and resolves its exact pack digest
through the installed built-in/registered artifact inventory. Invalid or unavailable authority is
quarantined rather than promoted. Registered plus quarantined primary keys must be a disjoint,
set-equal partition of the canonical input. Collisions and injected failures roll the whole change
back; an input/partition-digested receipt makes retry deterministic and refuses changed-input
restart.

Consumer closure now comes from the committed TypeScript import graph compiled under the shared
repository/compiler authority. Its receipt names the exact repository commit and paths. Missing,
extra or duplicate imports and local fallback authorities fail; no caller list can declare itself
complete.

## Boundary

This is executable contract evidence, not production implementation. No schema, registry content,
migration, server, API, client, Campaign, Skills, archive or protected-design byte changed. The
shared-resource bootstrap and a genuinely fresh review still gate implementation.
