# Proposed intent amendment — `design/03` and `design/06` after the concept registry landed

**Filed:** 2026-09-24 · **By:** claude (concept-registry implementation lane) · **For:** OWNER
**Trigger:** `CLAUDE.md`, clause added 2026-08-24 ([[D1505]]): *a change set that falsifies a
sentence in `design/00`–`06` adds a proposed intent amendment (the file, the exact sentence, and
what is now true) to `planning/platform-alignment/` in the same commit.*
**Change set:** `rfc/concept-registry.md` at migration 28 (receipt:
`planning/concept-registry/implementation-2026-09-24.md`).
**Law 5 holds:** nothing in `design/` is edited. This file reports that intent now disagrees with the
tree; it enacts nothing.

---

## 1. Falsified: `design/03-product-breadth.md:329` (B7 row)

**Exact phrase:**

> Cross-pack concept identity deliberately absent (a studio/B11 contract)

**What is now true.** Cross-pack concept identity exists. `content/concepts/` holds one immutable,
digest-named registry revision (168 seeded ids) and a head; `compileConceptRegistry` is the only mint;
pack validation, `make pack-check` and Pack Studio publication refuse an unregistered or retired id
as an error; Pack Studio offers a registry-only picker. Attempts store `concept:<id>@1` with the
exact registry revision, and the related-attempt relation is the cross-pack `same_concept`
(`same_concept_in_pack` is retired and rejected). The authoring contract sits with the pack studio,
as `design/01-training-model.md:60-65` asked.

**Suggested wording.** "Cross-pack concept identity shipped 2026-09-24 (`concept-registry`, migration
28): one registered id per idea across packs, enforced at publication; related retry includes the
same registered concept in another pack."

## 2. Falsified: `design/06-campaign.md:392-397`

**Exact phrase:**

> the default resolver keys them `pack:${packId}#${raw}`, so the same string in six packs is six
> keys

**What is now true.** The pack-scoped resolver is removed. The production resolver keys a registered
id as `concept:<id>@1` regardless of pack; migration 28 rewrote every legacy `pack:<pack>#<id>` row it
could verify through its run and exact pack artifact, and quarantined the rest with a closed reason.
The vocabulary is still mostly singletons (the registry does not merge or rename anything), so the
sentence's conclusion — that a collection screen over the raw vocabulary would show things nobody can
complete — still stands; only the mechanism it names is gone. The Campaign catalogue remains the
successor consumer (`rfc/concept-registry.md` Discharge D4).

**Suggested wording.** "…132 of 156 authored `concepts` are singletons. Identity is now global
(`concept-registry`, 2026-09-24), but global identity does not make singletons recur: a collection
screen over the raw vocabulary would still display things nobody can complete."
