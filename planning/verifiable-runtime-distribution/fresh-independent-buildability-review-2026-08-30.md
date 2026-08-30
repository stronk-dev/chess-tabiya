# Verifiable runtime distribution — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/verifiable-runtime-distribution.md` at its first independent review
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make runtime-distribution-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; no workflow, image, release format or About surface is authorized

The signed/attested multi-architecture appliance, CPU-only Maia split, resource tiers, native proof,
SBOM/filesystem reconciliation and authoring-file exclusion are the right 1.0 boundary. Four seams
make the current release graph either contradictory or able to pass without the product it claims
to release.

## B1 — the release manifest is a shared durable protocol ([[D2206]])

The RFC calls `release-manifest.json` a release-local format owned by one producer/parser and claims
no register. The same document requires a repository generator, read-only verifier, Compose
generator, release uploader, server About/API, clean-host consumer drill and offline verification to
consume its fields. It is also persisted as a release asset across versions.

That is a shared, versioned, cross-component resource by the repository's own register rule. The
RFC publishes neither a format discriminator nor a closed schema/type, so readers can drift while
all “one producer” checks remain green.

**Required repair:** define one versioned canonical schema/type, claim one shared-resource register,
derive all readers from it and cross missing/extra/unknown-version fields plus digest-algorithm
drift.

## B2 — image digest and embedded release manifest form a cycle ([[D2207]])

The manifest records the pushed server image digest and is generated only after that digest exists.
The server image definition simultaneously requires the exact release manifest inside the image,
and About must consume that embedded manifest. Adding the manifest changes the image bytes and
therefore its digest, so no fixed point can be built by the specified order. `NOTICE.txt` has the
same risk when it is generated as a projection of the post-push SBOM and then required inside the
scanned image.

**Required repair:** break the graph explicitly. For example, embed only immutable pre-image build
metadata/notices and mount or fetch the signed release index externally, or split a pre-image
manifest from a post-image signed release index. Publish one acyclic generation order and test it.

## B3 — “FOSS-eligible” is not a closed predicate ([[D2208]])

The validator rejects proprietary/licence-ref and most unknown items, but the RFC defines no
accepted SPDX expression set, exception policy, dual-licence selection rule or signed curated
override authority. A scanner guess cannot decide this, and “not visibly proprietary” is not a
positive FOSS predicate. Two conforming implementations can disagree on the same custom or compound
licence expression.

**Required repair:** publish a versioned licence-policy input with accepted/refused expressions,
exception/dual-licence rules and exact curated override provenance. Cross AND/OR/WITH expressions,
custom `LicenseRef`, missing texts and conflicting scanner/curated results. D1 remains a separate
weight-byte authority gate.

## B4 — the CPU journey can measure a bot that does not ship ([[D2209]])

The CPU peak requires 100 sequential opponent selections at the “widest supported candidate
window.” At HEAD, `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])` and its regression asserts the
empty roster. No production profile, route or candidate-window identity is named here. A
test-created profile can therefore satisfy memory/startup criteria while the 1.0 bot path remains
absent—the same false-consumer class previously found in the bot RFCs.

**Required repair:** depend on one accepted and reachable production bot profile/route, name the
exact profile digest and candidate-window operation in the resource receipt, and require the native
journey to traverse that production path. Until then CPU sizing can be research evidence, not
release acceptance.

## Re-review order

1. Define the registered release protocol and acyclic artifact graph together.
2. Define the closed FOSS policy and retain D1 as a distinct exact-weight gate.
3. Bind resource proof to the eventual live bot operation.
4. Invert all four arms, then re-review after F12-A/C/D are accepted enough to make their composed
   journey concrete.

No finding weakens the owner's core/cpu/optional-accelerated product decision or the numerical
ceilings; it prevents those ceilings and signatures from validating the wrong artifact graph.
