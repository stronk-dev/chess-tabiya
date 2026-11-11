# RFC: Bounded frozen-data verification metadata

- **Status:** accepted — 2026-11-11 after independent buildability and meaning reviews; finite implementation and measurement remain.
- **Author:** codex, under the full-foundation 1.0 ruling.
- **Created:** 2026-11-11
- **Parent / amends:** evidence-value-authority.md, recursive freezing and payload digest memoization.
- **Work:** [[D4226]], within [[D4225]] and [[D1716]].
- **Planning:** planning/foundation-source-identity/plan.md.
- **Exploration gate:** executed original-source allocation/reset experiment below.
- **Design refs:** design/02-product-shape.md self-hostable appliance; design/03-product-breadth.md grounded evidence; ADR-0005.

```tabiya-claims
none
```

## Summary

Bound the pure recursively frozen-data verification shortcut with two weak generations.
Eviction causes ordinary rechecking; all evidence authority and bytes remain unchanged.
Keep the candidate only after actual source-equality, memory/cost and complete gate proof.

## Problem and evidence

The actual 32-decision/all-thirteen-family source workload leaves substantial metadata after
its source owner and reading/factory/position maps are released. The independently reviewed
diagnostic associates 256 MiB of sampled native allocations with frozen-data verification.
Extra collection and one insertion leave post-work heap at 334.63 MiB; replacing only the
verification WeakSet lowers it to 78.63 MiB. Fourteen genuine both-color controls preserve
original evidence admission and receipt identity, then fresh payloads, prerequisite identities,
availability and receipts across all thirteen families. This is a marginal diagnostic effect,
not a root census, strong-key leak or production memory measurement. `[V]`
([research](../design/research/module-evidence-assembly.md#frozen-data-verification-metadata--d4225-2026-11-11),
[58,251-byte report](../planning/foundation-source-identity/outcome-immutable-reset-2026-11-11.json),
[actual control](../tools/d4175-outcome-delivery/measure.ts))

`IMMUTABLE_DATA` is a performance shortcut for already verified recursively frozen own data.
It supplies neither identity membership nor value/source receipts. Forgetting an entry must
mean checking/freezing again or computing the unchanged digest, never accepting new evidence.
The rest of the retained metadata and the wide service's live population remain D4225 work;
acquisition cost remains D4224. This RFC does not close either parent.

## Specification

### A bounded, weak verification memo

Replace only the global frozen-data verification set with a private two-generation memo.
Each generation is a WeakSet; the memo keeps no array, queue or strong set of its keys.
There are at most 65,536 add operations per generation. Before an add that would exceed
that bound, discard the older generation, retain the current generation as previous, and
start an empty current generation. Membership checks consult current and previous.
Duplicate adds may count against the bound; that can forget a shortcut sooner and never
extends retention. No timestamp, timer, process-global registry, finalizer, external setting
or automatic capacity growth is introduced.

Use one small package-internal helper in `packages/runtime/src/frozen-data-memo.ts` so tests
can exercise real rotation with a small constructor capacity. The production instance in
`evidence-contract.ts` uses the fixed 65,536 bound. The helper accepts object keys only and
exposes membership/add operations, not authority issuance, cache contents or a public reset.
It is absent from the package barrel and application configuration.

The insertion bound limits verification metadata growth; it is not a portable byte limit on
V8 storage or a bound on live evidence payloads. Keeping a prior generation reduces abrupt
loss of reuse during a traversal. Changing the numeric policy requires measured cost evidence,
not an increased product deadline or discarded required source. If the candidate has no useful
memory benefit or introduces an unacceptable source-cost regression, reject/revise it rather
than report this RFC complete.

### Preserve freezing, digests and authority

`freezeData` retains its order: fix the parent's slots first, inspect every own string/symbol
property, recursively freeze data descendants, reject accessors/custom prototypes/array holes
as digest-cache eligibility, and preserve alias/cycle behavior. Only successful verification
adds a shortcut. Membership misses follow the existing real recursive path.

`sealedPayloadDigest` consults the same bounded verification memo. A missing entry takes the
existing uncached digest path. Existing canonical serialization and SHA bytes do not change.
Do not use `Object.isFrozen` alone as a recursive proof, skip descendants, copy payloads,
insert an authority fallback, or alter when a receipt disagreement refuses admission.

Keep `DECLARED_VALUES`, `VALUE_RECEIPTS`, canonical/digest weak maps, consumer/rendered brands,
all source/invocation memberships, issuers, complete prerequisite lists, ordering and admission
unchanged. Rotation must not revoke original evidence, change any receipt, promote a source,
or create a module binding. No public cache reset or weak authority expiration is permitted.

### Verification and measurement

Permanent tests exercise actual helper rotation with tiny bounds: initial absence, current and
prior hits, oldest-generation misses and continued bounded rotation. Keys stay strongly held
in those tests so a miss proves eviction rather than garbage collection. Invalid capacities
refuse. The implementation must not store keys strongly.

Actual mint/admission tests cross multiple rotations while retaining older evidence and its
receipt. Old evidence must still admit with exactly the same receipt object/bytes; fresh
equivalent construction keeps exact digests. Include ordinary frozen trees, aliased/hidden/
symbol children, shallow shells, changing accessors, custom/sparse prototypes, cycles and
parent/descendant proxy mutation controls. A changing getter must still fail even if its
shell is frozen. Retain independent digest checks instead of comparing a cache to itself.

Before/after source measurements use identical real 32-decision workloads, actual service
capacity and all thirteen factories/admission paths. Preserve complete serialized payload and
receipt equality and exact original prerequisite identity in each side's repeated controls;
matching event counts alone cannot prove semantic equality. Keep result reports compact.

The primary comparison uses each baseline/candidate's ordinary production-source build,
with neither sampler nor reset/clear hooks. Include fresh-process cold cost and post-owner-release memory, with no
WeakRef observers on the timed stream; job boundaries/forced GC are limited to explicit
before/after diagnostic checkpoints. Run several sequential counterbalanced pairs, retain
all pair results, and do not claim natural peak/RSS return or broad speed improvement.
The earlier reset experiment supplies a causal target, not the candidate's performance proof.

Re-run the unchanged real canonical source writer/checker. The sole newly imported helper
adds exactly `packages/runtime/src/frozen-data-memo.ts` to each actually affected operation's
`files` closure. Recompute affected `implementationDigest` values with the existing algorithm;
each affected population's `predicateImplementationDigest` must equal its exact operation's
current digest. Those exact file-list additions and corresponding implementation hashes are
the only permitted metadata changes. Preserve every other operation field and all 1,928 case
outcomes, 24/89 qualified subjects, case/population inputs/results, externals and verdicts.
Do not weaken certificate/history guards to refresh metadata. D3928's content hold remains.

## Acceptance criteria

1. The real memo rotates at its stated finite bound, keeps only weak keys, retains at most
   two generations and has deterministic current/prior/eviction tests with live key objects.
2. Recursive own-data freezing and every unsafe-cache refusal above retain their behavior;
   existing original authority and independent payload digest controls pass across rotation.
3. Original old evidence and receipt identity survive rotation; no issuer/authority map or
   source payload/input/receipt/ordering/admission semantics change.
4. Complete real-source before/after equality and counterbalanced cost/memory measurements
   demonstrate a useful bounded-memo benefit without relying on the reset diagnostic,
   weakened deadlines, missing sources, event counts alone or cherry-picked trials.
5. The canonical current checker retains all 1,928 outcomes and current subject verdicts;
   history/staged controls pass with only justified implementation metadata refreshed.
6. Focused tests, types/build and complete normal software/performance/governance gates pass.
   Docs, ledger, work-state and log close out the finite repair in its landing commit.

## Deviations from design

None. This is internal resource control, with no learner policy, source meaning, schema,
content, module, preset, role or deployment setting change.

## Discharges

none

## Open questions

None for review. The fixed candidate still has to earn retention on real measured benefit;
the RFC is not a performance result or permission to raise another budget.

## Changelog

- 2026-11-11: drafted from the independently reviewed actual-source metadata intervention.
- 2026-11-11: independent review requires the helper's exact import-closure addition to be
  explicit, alongside recomputed existing hashes and unchanged remaining semantic records.
