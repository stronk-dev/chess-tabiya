# Pack capability contract — fourth fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/pack-capability-contract.md` plus both author artifacts after D2152–D2156
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make pack-capability-fourth-fresh-review` — 6/6 blocker arms
- **Production/corpus status:** untouched; lane 0.30 and [[D560]] remain held

The cumulative schema images, 397-member target inventory, module-qualified meaning sites,
lockfile-resolved `chessops` source and typed withdrawal branches all survive review. Six remaining
seams still require the implementer to invent authority or make mutually incompatible gates pass.

## B1 — the legacy “allowlist” is only an opaque digest ([[D2334]])

The transition artifact's `legacy` object has `catalogueDocuments:92`, an algorithm label and one
population SHA-256. It contains no path/raw-digest rows. No other file contains that digest, and the
author checker never reads `populationSha256` or `catalogueDocuments`. The RFC nevertheless requires
`PackRegistry` to admit only an exact path+raw-digest member. There are no bytes from which it can
make that decision without re-inventing the authority.

**Required repair:** publish the exact sorted 92-row manifest or a deterministic checked generator
whose output is retained and independently recomputed. Cross edit, deletion, rename, path swap and
a 93rd otherwise-valid pack. The author target must fail on population drift, not merely repeat the
stored digest.

## B2 — software-first landing and criterion 3 cannot both pass ([[D2335]])

The transition explicitly lands software before D560 and accepts the exact unstamped 0.27 legacy
population. Criterion 3 simultaneously requires `requires` on all 92 packs to equal the derived
closure. Those current files intentionally have no stamp. Reading them through a compatibility
parser does not make an authored array exist or compare byte-for-byte.

**Required repair:** split acceptance into a pre-apply software gate and a post-D560 corpus gate.
The first proves exact legacy admission plus a complete projected migration without changing packs;
the second proves all 92 canonical stamps, dependent digest updates and deletion of the legacy
reader/allowlist. Neither gate may impersonate the other.

## B3 — unconditional applicability loses version authority ([[D2336]])

The normative `CapabilityApplicability` requires a structured `CapabilityId`, yet every one of the
14 `always` rows stores a bare string and no selector. The generator includes those rows unchanged
in `expandedAuthoritySha256`; it neither assigns nor checks a version. An implementer must silently
assume integer version 1 or invent a conversion, defeating the one-version-grammar premise.

**Required repair:** make the author rows exact `{selector:{kind:"always"}, capability:{id,version}}`
values and keep meaning sites in a separately typed join if needed. Cross stale, missing and
wrong-arm versions.

## B4 — the lifecycle fixture validates a second type algebra ([[D2337]])

`CapabilityDeclaration` is declared with `id:string` and a separate `version`; it has no
`subjectId`. The new author fixture instead creates `{subjectId,id:CapabilityId,disposition}` rows,
omitting the declaration's sources, dependencies, digest and version fields. Because the harness is
plain JavaScript, its successor and cycle greens do not prove that the production declaration type
can represent those states.

**Required repair:** choose one identity model, use it in `CapabilityDeclaration`, history and
planner input, and compile the literal successor/cycle fixtures with `satisfies` against that actual
type. No test-local lookalike is authority.

## B5 — `/capabilities.packCapabilities` is not a closed wire ([[D2338]])

The RFC first describes rows as `{id,version,disposition}`, then says each also carries deployment
reachability. It never defines whether `disposition` is semantic state or reachability, nor a public
row/result type. The current server and web each own separate `Capabilities` interfaces, but the RFC
names neither update nor a shared parser. Both can compile with different JSON beliefs.

**Required repair:** publish one closed row with separate semantic-disposition and reachability
fields, safe public reasons and exact version shape; bind the server producer and web parser/type to
one authority. Cross every semantic/reachability combination, unknown fields and a server-only
addition.

## B6 — transient enforcement trusts the caller's requirement list ([[D2339]])

The mutation boundary is `requireCapabilities(operationId, requiredIds)`. No closed operation map
or internal derivation proves `requiredIds` complete. A route can omit the currently down provider,
pass the check and mutate the run while every provider fixture remains green. Passing all pack
requirements would be safe but could block unrelated local operations; the contract chooses neither
policy.

**Required repair:** compile exact operation→capability bindings, or derive the required set
internally from the registered pack and operation. Reject missing/extra caller lists and prove every
mutating application route checks its authoritative set before its first write, including recovery
and idempotent replay.

## Re-review order

1. Materialize the legacy identity authority and split pre/post-apply gates.
2. Normalize unconditional and lifecycle types.
3. Close the API response and operation binding.
4. Invert all six arms while preserving every prior author/review contract.
5. Request a fifth fresh independent review and run the ordinary full repository gate.

No schema, registry, pack, digest, API, client, content, archive or protected-design implementation
is authorized by this return.
