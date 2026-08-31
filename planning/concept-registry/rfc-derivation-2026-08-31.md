# Concept registry foundation — derivation (2026-08-31)

## Why this is separate

[[D300]] blocks both the ruled Campaign catalogue and Skills. `rfc/skills.md` correctly identifies
the four mechanical changes—registry, global resolver, query widening and migration—but placing
them inside Skills would make a neutral identity primitive wait on unrelated valence, taxonomy and
learner-claim rulings. Campaign would then either wait or copy it. [[D2370]] records the shared-
resource consequence: the registry needs its own schema/digest/register and one compiler.

## Current facts re-derived at HEAD

- `PackScopedConceptResolver.resolve()` emits `pack:<packId>#<raw>`.
- `attempt_concepts` persists that key and label with an index on `concept_key`.
- `same_concept_in_pack` additionally filters `a.pack_id = ?`, so changing the resolver alone does
  not produce cross-pack retrieval.
- pack schema accepts any unique non-empty string; lint is warning-only; production pack validation
  has no registry membership check.
- `rfc/skills.md` measured 199 references / 168 ids / 25 recurring ids at its 2026-08-23 snapshot.
  Those numbers are historical evidence, not constants for the implementation: the compiler reads
  the current corpus and requires set equality.
- no schema/register/digest currently owns `content/concepts/registry.json`.

## Boundary

This RFC owns identity only. A concept entry says that one authored identifier and learner-facing
label exist. It does not say the concept is good, that a learner demonstrated it, which category it
belongs to, or which evidence proves it. Skills owns valence/credit/category. Campaign owns binary
exposure collection. Packs continue to author references.

## Serialization

The process prerequisite first creates absent `concept-registry-schema`. This RFC later takes the
unique `first lane 1` claim. Its data migration is inserted behind longitudinal-store; bot-policy
moves behind concept-registry so every later consumer sees globally stable keys.
