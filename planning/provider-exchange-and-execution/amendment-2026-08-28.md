# Provider exchange amendment handoff — 2026-08-28

## Verdict

The eight findings in `independent-buildability-review-2026-08-27.md` are repaired at the authoring
tier. The RFC remains draft and production implementation remains unauthorised until a repeat
independent buildability review attacks the amended contract.

## Literal repairs to review

| return | amended authority | able-to-fail arm |
|---|---|---|
| D1871 | occurrence-addressed canonical `pathId`; global reach stays on `/capabilities`; exact run/module/request satisfaction uses `SubjectEvidenceAvailabilityRequest` | same projection differs across subjects; member/occurrence changes path id |
| D1872 | immutable `ProviderAcquisitionReceipt` inside discriminated live/retained `ProviderDelivery` | live→retained retains the acquisition object and retrieval time |
| D1873 | separate `MaiaRunMoveOccurrence` and `MaiaExactFenMoveOccurrence`; run join compares sealed start plus complete ordered path | same-FEN transposition and cross-kind occurrence fail |
| D1874 | exact-only legal-root admission plus narrowly reached MultiPV capability migration | upperbound, lowerbound and incomplete rows fail |
| D1875 | closed Explorer request, success/domain result, zero-population, history/opening and move-row types | zero and sparse populations retain literal mass and rows |
| D1876 | discriminated optional/required `BindingSourceAbsence` plus fixed precedence | local+provider, recorded-or-live, mixed-provider and all-absent cases cross |
| D1877 | exact five-member request/result maps, descriptor map and scheduler-owned execution hook | operation set is closed and set-equal |
| D1878 | pending key contains requested bytes only; actual generation is captured in acquisition and checked for retained admission | cold key is constructible; changed generation refuses retained result |

## Review attacks added during the amendment

- Repeated derived subgraphs must not alias: derivation choices carry an input-index occurrence
  address, not only projection/member.
- `TypedProviderRequest` is distributive over the operation union, preventing an operation id from
  pairing with another operation's request.
- Live delivery requires `cacheIdentity: null`; retained delivery requires a concrete identity.
- Maia returns explicit bounded width/mass instead of implying model completeness.
- Explorer zero population requires every W/D/L component to be literally zero.

## Commands

Run the focused contract using the repository-owned toolchain:

```sh
make provider-exchange-contract
```

Then run the normal repository gate before any checkpoint:

```sh
make verify
```

The first command passes 8/8 on the amended authoring candidate. Full verification is a checkpoint
obligation, not evidence that the RFC is accepted.
