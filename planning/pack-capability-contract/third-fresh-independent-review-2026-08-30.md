# Pack capability contract — third fresh independent buildability review

**Date:** 2026-08-30

**Reviewer:** Codex, independent of the Claude author-repair

**Verdict:** **RETURNED.** The staged admission model, structured capability identity,
plan/readiness split and two-state availability model remain sound. Five executable authority gaps
still make implementation unsafe. No schema, registry, pack or product code is authorised by this
review.

## Reproduction

`make pack-capability-third-fresh-review` passes 5/5. These tests are disposable review instruments:
they demonstrate the five current blockers and are deliberately outside the production verifier.

## Blocking findings

### D2152 — the sealed 0.30 image discards lanes 0.28 and 0.29

The schema register already assigns lane 0.28 to accepted `graduation-clearance.md` and lane 0.29
to accepted `pack-population-provenance.md`. Their declared additions include graduation clearance,
corpus evidence, `provenance_note` and `citable_text`. The ordered transition artifact instead
patches the current 0.27 schema directly with only `$id`, description, `requires` and its two
definitions. Applying that patch produces a byte-sealed 0.30 image containing none of the 0.28 or
0.29 changes.

This is not merely a landing-order inconvenience. If 0.30 lands first, the register makes the older
lanes illegal; if either older lane lands first, both the transition's sealed 0.27 source and its
0.30 target digest become false. The author must publish a cumulative legal transition whose source
and target include every predecessor, or explicitly serialize behind exact accepted predecessor
post-images. A lane may not leapfrog accepted claims.

### D2153 — a digest is standing in for 373 applicability decisions

`pack-capability-applicability-v1.json` reports 373 mapped members and an
`expandedMappingSha256`, but contains no mapping rows, source inventory or member list. No checked
generator for `stable-schema-member-v2` exists in the tree, and the maintained author test does not
recompute the expanded digest. An implementer would still have to decide all 373
member-to-capability relationships—the semantic authority this artifact claims to remove.

Publish the literal rows, or a deterministic checked generator plus a complete independently
recomputable source inventory. The digest must be verified from those bytes, not accepted as an
opaque assertion.

### D2154 — unconditional meaning sites are not resolvable sites

The 14 `always` rows use bare names such as `moveQualityGrade`, `evaluateObjective` and
`GUARD_DEFAULTS`, while `CapabilitySite` requires repository-relative module plus symbol. The same
artifact's interpreter roots already use `path#symbol`, proving the two authorities are at different
grains. Named convention tables—including grade, material, exchange and phase constants—are also
absent from the artifact.

Every unconditional row must carry exact module-qualified sites and all meaning-bearing constant
dependencies. Zero or multiple symbol matches must fail generation.

### D2155 — external chess semantics are outside the digest boundary

Runtime structural truth imports `chessops`, but `CapabilityMeaningSource` admits only schema
members, local AST sites, F1 projections and resolved authored content. The applicability authority
contains no external package, lockfile or version source. A dependency upgrade can therefore change
the truth of a capability while every declared source image and semantic version remains unchanged.

Add an exact external-dependency authority—at minimum package identity plus lockfile-resolved
version/integrity—for every external library whose behavior contributes to a capability. The
dependency must participate in the semantics digest and have an able-to-fail drift fixture.

### D2156 — withdrawal cannot encode the successor the lifecycle promises

The summary promises that every withdrawn capability carries a successor or explicit refusal, and
the lifecycle prose permits omission only when no migration exists. The actual `withdrawn` union arm
has no successor field. The RFC's own `EngineRequest.afterCommands` row says request-scoped state is
its shipped successor, but there is nowhere to retain that identity. Old requirements therefore
resolve as obsolete without a machine-readable migration path.

Add an optional typed successor to withdrawn declarations (or an equally explicit history edge),
require it when a replacement exists, and require the migration planner to follow it. Cross
successor-present, lawful-no-successor, wrong-subject and cycle cases.

## Required author return

The next author pass must repair D2152–D2156 without implementing lane 0.30 or weakening the D560
corpus hold. Fresh independent review remains required afterward. The surviving contract should be
kept small: structured ids, semantic versions, plan/readiness separation, legacy-catalogue-only
admission, availability semantics and the refusal to let metadata stamp itself do not need to be
re-litigated.
