# Provider-protocol register — second fresh independent buildability review

**Date:** 2026-09-05

## Verdict

**Return to author.** The canonical descriptor candidate parses, but the generic-engine rebase is
not executable as written. Five independent groups reproduce six ledger defects, [[D2809]]–
[[D2814]]. No catalogue, register, provider, runtime, schema, migration, API, client or content byte
changed.

## Findings

1. The advertised `make provider-protocol-fresh-review` still executes the superseded bespoke
   C11/`RESOURCE_NAMES` assertions and fails 0/5 on the repaired RFC. The claimed seventeen current
   fixtures have no successor target ([[D2809]]).
2. The process RFC promises a generated README register twice; the generic parent explicitly says
   `rfc/README.md` is human-owned and checked, never generated ([[D2810]]).
3. The normative type-relation interface yields TypeScript TS1337 because an index signature cannot
   use the literal-union `ProviderOperationId`; criterion 4's compile claim is false ([[D2811]]).
4. Copied operation/domain consumer detection names no population or algorithm, and the validation
   hook it relies on exists in neither the exact descriptor grammar nor the generic bootstrap
   engine ([[D2812]], [[D2813]]).
5. The routing summary supplies a `.version` selector for `canonical_resource@1`, while the parsed
   descriptor has only its atomic root and the generic parent's canonical-resource row uses `none`
   ([[D2814]]).

## Executable evidence

`make provider-protocol-second-fresh-review` passes 5/5 falsifier groups at reviewed HEAD. The
review reads the exact descriptor through the generic catalogue parser and asks TypeScript for the
diagnostic rather than matching prose alone.

## Repair boundary

A bounded author repair must make the named target current and part of normal verification, mirror
README ownership, use a compilable mapped relation, define the consumer population, and either add
a real generic hook contract to the bootstrap or keep product validation in the product RFC. It
must also make the routing summary byte-equivalent to the descriptor. Generic-engine acceptance and
implementation still precede this process RFC's implementation.
