# Intent presets — third author repair

**Date:** 2026-08-30

**Scope:** author repair for [[D2171]]–[[D2178]]; no production implementation.

## Outcome

The preset contract now has one authority path:

1. a browser-created requested receipt containing only strict preference intent;
2. a server-authoritative result containing context/access/module decisions;
3. a server-finalized result joined to sealed source receipts; and
4. one browser-local receipt that may only narrow speech output.

Every stage is discriminated and digest-correlated. Browser readiness no longer appears in the
server request, and the old monolithic compiler is deleted from the normative contract.

The v2 preference envelope persists a closed intent union (`unset`, `explicit`,
`migrated_snapshot`, `invalid_fallback`) instead of flattening every arm into preset/override
bytes. Round-trip fixtures cross all four arms. Named preset selection clears Custom module
deltas; retaining customization is an explicit Advanced action. `rules_floor` is excluded from the
configurable module type, independently rejected by the parser, and reinserted at the server
boundary. Malformed/storage-unavailable recovery has its own safe typed notice whose renderer
never reflects stored bytes.

The repair does not bless incomplete dependencies. The current module artifacts say
`requirements_only`, so effect-source compilation refuses with `MODULE_AUTHORITY_NOT_ACCEPTED`.
The durable preference, staged assistance exchange and permission vocabulary are named as three
shared resources; their register/check implementation remains a hard predecessor. The RFC keeps
its current `none` block until that process can express truthful claims.

## Verification

`make intent-presets-second-author-repair` passes 9/9. No production, protected design, schema,
content or archive byte changed. Fresh independent review remains blocked on the accepted/landed
module source authority and the shared-resource register extension.
