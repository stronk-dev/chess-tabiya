# Pack capability contract — fifth fresh independent review

- **Date:** 2026-08-31
- **Artifact:** `rfc/pack-capability-contract.md` after the [[D2334]]–[[D2339]] fifth author repair
- **Verdict:** return to author on [[D2429]]–[[D2431]]
- **Executable review:** `make pack-capability-fifth-fresh-review` — 3/3
- **Author control:** `make pack-capability-author-repair` — cumulative generator, 6/6 repair arms and strict typecheck pass
- **Production authorization:** none; D560 remains whole

## What survived

The fifth repair closes the six boundaries returned by the prior review. The legacy compatibility
authority now carries and recomputes its exact 92 path/digest rows; software and post-migration
corpus gates no longer impersonate each other; unconditional applicability rows retain structured
ids; declaration/history identity is coherent; the public wire is a closed shared type; and routes
cannot directly supply `requiredIds`.

## Return findings

1. **[[D2429]] — `run.create` assumes a pack that the live operation does not require.** The one
   operation binding assigns `run.create` to `registered_pack/static_admission` and says it resolves
   a parsed/registered pack. The production request union also admits a `position` session, and its
   durable run carries null pack identity. Imported sessions form the same non-pack class through a
   separate route. The contract needs a session-source discriminant: pack creation derives all pack
   requirements; non-pack creation derives only fixed runtime/provider requirements. Neither may
   silently borrow the other's empty or complete requirement set.
2. **[[D2430]] — the promised operation census has two unjoined identity vocabularies.** The closed
   `CapabilityOperationId` union has eleven dotted ids. The explicit no-provider set has twenty-two
   snake-case ids, none of which can inhabit `OperationCapabilityBinding`. Production routes use a
   third grain: `moves` branches into user/opponent operations, `marks` into replace/rescope and
   `grants` into grant/revoke. No typed method+route+body-discriminant projection joins those grains.
   Therefore the criterion cannot prove that every first-flight branch is covered exactly once.
3. **[[D2431]] — the shared public parser lacks the fact needed for one required rejection.** The
   public row omits `CapabilityDeploymentBinding.availability`, yet the schema-package parser must
   reject `temporarily_unavailable` for local/build-time capabilities. The exact same wire row is
   valid when its private binding is `provider` and invalid when it is `local`; structural parsing
   alone cannot distinguish them. Hard-coding runtime identities into the schema parser would create
   the second authority this RFC is designed to remove.

## Required next pass

Make creation source-aware; derive one exact operation identity from HTTP method, route and body
discriminant and set-equal every provider/no-provider branch to the binding registry; and either
carry a safe availability-mode field on the public row or separate structural parsing from a
registry-backed semantic validator with one shared generated authority. Preserve the six repaired
boundaries and rerun the cumulative author contract before another fresh review.

No schema, registry, migration, pack, API, client or runtime enforcement implementation is
authorized from this returned draft.
