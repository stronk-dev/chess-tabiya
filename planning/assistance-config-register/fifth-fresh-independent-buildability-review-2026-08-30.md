# Assistance shared-resource registers — fifth fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make assistance-register-fifth-fresh-review` — 6/6 blocker arms
- **Production status:** untouched; C9/register/product changes remain unauthorized

The four-resource split is directionally correct, but the extension does not define executable
tree/transition authorities for three resources and its positive check proves prose presence.

## D2355 — workflow-v1 is not the claimed strict grammar

`loadWorkflowPreset` accepts `{version:1,preset:"support",undeclared:"accepted"}` and its result
depends on the context's `allowedPresets`. The RFC calls this strict `{version:1,preset}` while its
process boundary forbids repairing web code. Model the real historical behavior or authorize and
specify a compatible strict-parser repair.

## D2356 — workflow-preference has no exact resource tree

The RFC promises parser, serializer, return-site and package-export drift detection but defines
only `AssistanceConfigTree`: no workflow roots, dependency graph, digest input or v1→v2 transition
algorithm. Publish all four plus formatting-equivalent and semantic-change controls.

## D2357 — absent exchange has no registered root

Absence supposedly means a “registered production root” does not resolve, but no path/symbol is
registered; the proposed claim is a placeholder. Name the exact future root/version authority and
operation graph so never-landed, missing and renamed are distinguishable.

## D2358 — landed-to-absent regression is legal

The contract covers absent→claim→head 1 but never refuses deletion/rename of a previously landed
root back to `absent`. Make absence legal only before the first landed history row and cross the
regression under staged and committed history.

## D2359 — the permission claim omits semantic changes

The proposed claim names only `AssistancePermission`, while adding `legal` changes
`contextClamp`, `accessPermission`, `permittedAssistance` and authoritative compilation. Define a
permission authority graph and require the claim's changed-symbol set to match it.

## D2360 — the positive contract executes no extension semantics

The D2178/D2328 tests assert names and phrases in RFC prose. They import no proposed parser/state
model, construct no transition and cross no refusal. Add an executable disposable model for roots,
tree states, claim grammar, collisions and legal/illegal transitions.

Repair [[D2355]], [[D2356]], [[D2357]], [[D2358]], [[D2359]] and [[D2360]] while preserving the
four resource identities and truthful absent state. Another fresh review is mandatory.
