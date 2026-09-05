# Safe deployment profiles — third author repair

- **Date:** 2026-09-05
- **Scope:** RFC-tier repair for [[D2730]]–[[D2735]]
- **Verdict:** author repair complete; another genuinely fresh independent buildability review is
  required before acceptance or production implementation
- **Executable receipt:** `make safe-deployment-third-author-repair`

## What changed

The repaired contract treats deployment success as one authority. Mounted bytes must match the
renderer digest and the complete selected profile relation. A private deployment subject binds the
operation, compiled config/image, immutable revision and artifacts, profile, and compiler-derived
origin; checks and receipts cannot be transplanted between equal-looking subjects.

The receipt model now implements the declared versioned succeeded/refused/failed/cancelled union,
canonical unknown-input verification, exact check/service/artifact tuples, an immutable
40-lower-hex application revision and non-negative safe elapsed time. Proxied live artifacts require
a sealed handshake result carrying exact leaf/SPKI/chain/trust-root digests, successful chain
validation, singleton SAN, hostname and canonical UTC validity/observation instants. Readiness joins
the canonical storage proof to that same deployment's release and mounted-image attestations.

Profile migration now persists the complete from/to state in the fixed operational state file by
exclusive temporary creation, file fsync, rename and parent-directory fsync. Session invalidation
and public-token revocation are separate idempotent SQLite transactions. Close/reopen fixtures
resume after each effect; target readiness must match the intended target's profile, origin, config
and image, and final publication additionally requires a sealed ingress-switch result for the same
target.

## Verification

`make safe-deployment-third-author-repair` retains the original 8 author controls and the second
repair's 5 groups, then passes 6 new able-to-fail groups plus strict TypeScript:

1. impossible but canonical mounted profile tuples and wrong expected digests refuse;
2. crossed subjects/checks and invented check operands cannot compile success;
3. every terminal receipt arm round-trips, while mutable revisions, unsafe elapsed time and
   noncanonical bytes refuse;
4. untrusted/future/multi-SAN/structurally cloned TLS observations refuse;
5. incomplete or crossed storage/deployment readiness refuses; and
6. durable effects and phase state survive repeated database/journal restart, while wrong target
   readiness and forged ingress authority refuse.

No production server, Compose, Caddy, workflow, release, content, archive or protected-design byte
changed. This receipt is evidence that the returned contract is buildable, not evidence that the
deployment product exists.
