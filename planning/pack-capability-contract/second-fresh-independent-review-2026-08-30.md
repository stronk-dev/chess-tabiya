# Pack capability contract — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/pack-capability-contract.md` after the D2050–D2055 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make pack-capability-second-fresh-review` — 7/7 blocker arms
- **Prior contracts:** 7 + 11 + 6 remain green
- **Production status:** untouched; lane 0.30 and all corpus writes remain forbidden

The repair fixes the six things it set out to fix: shipped one-segment ids parse; the compact
artifact seals a deterministic 373+14+5 applicability image; annotation arrays are total; the two
prose roots are exact symbols; refusal authority points at protected design; and recursive instance
traversal is representable. Those decisions survive.

The second fresh pass tested the repaired mechanism at its landing boundaries rather than against
its own prose. Seven contradictions remain. Three form one circularity: implementation changes the
schema whose old bytes are the author authority, adds a required array absent from every pack, and
then derives requirements by walking that array itself.

## B1 — lane 0.30 cannot land without the forbidden corpus application ([[D2070]])

The only live drill-pack schema is edited in place and every validator reads it. The RFC makes
`requires` required and says absence is invalid. All 92 pack documents currently omit it, and the
same section says all 92 digests churn. Yet Discharge D5 orders implementation **without applying
the corpus plan**, while D3 defers the restamp/apply commit behind the D560 hold. There is no old-
schema reader, staged optional arm or compatibility loader. The implementation commit therefore
cannot make its own software/content verification green without violating either the required-key
rule or the content hold.

**Required repair:** choose and specify an atomic landing or an explicit versioned transition. If
atomic, the accepted RFC must authorize the mechanical corpus stamp/restamp unit and keep judgement
rows stopped. If staged, publish two real schemas/loaders and an exact retirement point; do not make
the new key optional in the final contract or silently validate old bytes as 0.30.

## B2 — `migration-plan-check` is required to be red and green ([[D2071]])

The migration plan exits non-zero whenever `judgement[]` is non-empty. Criterion 13 requires the
known D566 dependants to appear in that array. The command table then wires the plan itself into
`make verify`, and criterion 17 requires verify green. At the stipulated landing state, the same
bytes must return both exit codes.

**Required repair:** separate a deterministic **plan-shape/check** command that succeeds while
reporting blocked judgement debt from an **apply-readiness** command that fails on judgement. Wire
the former into ordinary verification and reserve the latter for the authorized apply gate. Cross
empty, mechanical-only and judgement-bearing plans.

## B3 — the author artifact seals the schema before implementation edits it ([[D2072]])

The artifact's schema SHA is the raw digest of today's unannotated 0.27 schema. Implementation must
add `x-tabiya-capability-*` arrays throughout that file and add the new root `requires` definition.
Either edit changes the raw SHA, inventory and expanded-authority digests that implementation is
required to equal. Updating the author artifact inside implementation would make the implementer
the authority D2051 was specifically returned to prevent.

**Required repair:** publish author-owned **post-migration schema bytes** (or an exact patch plus
post-image digest) before acceptance. The generator may verify that post-image; it may not redefine
the image while implementing it. Include the schema `$id`, register digest and all new vocabulary
members in the sealed authority.

## B4 — applicability is sealed; semantic source closure is not ([[D2073]])

The compact artifact deterministically names 373 schema-member capability ids, but contains no
member→interpreter-site map and no helper/constant dependency graph. The schema annotation grammar
also carries only member/source identity/capability—not `sources` or `dependsOn`. The RFC correctly
says imported helpers/constants affect a digest only through explicit sites/dependencies; it then
leaves the implementer to author those exact links while creating 373 declarations. D566 is one
handwritten positive, not closure for the remaining population.

**Required repair:** publish an independent complete source/dependency authority for every
AST-backed member (or a mechanical algorithm whose output is author-sealed), including multiple
interpretation sites and transitive helper/table roots. A helper-only mutation for multiple
families—not only outpost—must change exactly the intended digests; unused/same-name/wrong-arm
mutations must not.

## B5 — the requirement grammar participates in its own derivation ([[D2074]])

Every enum/discriminated `oneOf` under the pack schema must be mapped or excluded. The new
`capabilityRequirement.version` is itself a discriminated union with `integer`/`semver` members,
and the requirement algorithm evaluates every selector over the parsed pack. No exclusion for the
`/requires` metadata subtree exists. Thus adding the stamp creates new capability rows absent from
the 373-member authority, and each authored requirement causes the derivation to inspect the
representation of requirements themselves. Declared-versus-derived is no longer an independent
check.

**Required repair:** place capability metadata outside the semantic applicability population or
publish a precise, justified exclusion for the complete metadata subtree. The independent
derivation must depend only on the pack meaning being stamped, never on the stamp's own tuples.

## B6 — lifecycle cannot represent a version transition ([[D2075]])

The census unit is “one declaration per capability subject.” A semantic bump is required to record
a successor; a deprecated old capability's successor must resolve to an active declaration. That
requires both `id@1` deprecated and `id@2` active for the same subject. Removing @1 loses the typed
successor/history and makes old pack requirements merely unknown; retaining both violates the one-
declaration rule. No history/supersession registry resolves the conflict.

**Required repair:** define declaration identity and history explicitly—normally one declaration
per `(subject, version)`, exactly one current active version, retained deprecated/withdrawn versions
with acyclic successors, and a migration lookup that distinguishes unknown from known-obsolete.
Cross 1→2, chained 1→2→3, withdrawal-without-successor and duplicate-current cases.

## B7 — public ids change when a `oneOf` is reordered ([[D2076]])

`readable-schema-member-v1` writes `branchN` into the public id. JSON Schema `oneOf` order is not
semantic; reordering two branches preserves accepted instances but renames capabilities. That
contradicts the RFC's own claims that capability ids are stable public names and evaluator meaning
is versioned independently from JSON fields. A schema cleanup would manufacture hundreds of
successors without a chess or evaluator change.

**Required repair:** author stable public ids or derive them from a semantic discriminator identity,
never an array ordinal. Prove branch reorder and `$defs` relocation preserve ids while a real member
rename or evaluator meaning change follows the explicit successor/version path.

## Re-review order

1. Decide atomic versus staged schema/corpus landing and split plan-check from apply-readiness.
2. Publish the post-migration schema authority and exclude capability metadata from applicability.
3. Publish complete source/dependency closure and stable public identities.
4. Make version history representable.
5. Invert all seven arms, preserve the prior 7 + 11 + 6, run full verification, then request
   another independent review.

No schema, capability registry, pack stamp, digest restamp, migration plan application or runtime
handshake is authorized by this return.
