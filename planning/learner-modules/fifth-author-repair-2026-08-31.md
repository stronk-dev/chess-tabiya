# Module registration — fifth author repair

**Date:** 2026-08-31

**Input:** `fourth-fresh-independent-buildability-review-2026-08-31.md`

**Verdict:** author repair complete; fifth fresh independent review required

## Repair

- [[D2398]]: removed `projection_between_grains@1` and every synthetic subject view. Inputs keep
  their intrinsic position/edge/branch/prefix grain; derived rows retain one typed relation per
  literal input explaining how occurrences form the output subject.
- [[D2399]]: normative §2.5 now specifies only requirements over sealed pools. The old direct-call
  plan is marked historical/non-normative, deleted from the implementation contract and forbidden
  to implement.
- [[D2400]]: requirements no longer publish final timing. They retain the module request and broad
  source ceiling, with exact operation applicability null and dependency-blocked until the
  upstream projection/view operation lands.

The artifacts remain honest: 117 evidence requirements, 205 binding requirements, every row
dependency-blocked, and `completionClaim: requirements_only` with valid digests.

## Verification

- `make module-registration-author-contract`: 11/11.
- `make module-evidence-assembly`: 13/13.
- `make module-registration-fourth-author-repair`: 5/5.
- `make module-registration-fourth-fresh-review`: historical returns now fenced.
- `make module-registration-fifth-author-repair`: 4/4.

No production, schema, content, API, UX or protected-design implementation is authorized. The
successor image still waits on `evidence-value-authority`, and a fresh independent reviewer must
attack this repair before acceptance.
