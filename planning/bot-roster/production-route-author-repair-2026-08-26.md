# Bot production-route author repair — 2026-08-26

Author input for D1605–D1609. Read with
`design/research/bot-production-route-and-selection-budget.md` and the seven-arm operation census
in `tools/d1605-bot-route-boundary-harness/`.

## Replace the client-authoritative route

Do not finish the existing `profile` field pass-through on public `/select-move`. The accepted
route should use one server-owned, run-bound, atomic opponent-ply operation. It derives the active
root, history, seed and exact persisted profile digest; composes Maia → sealed guard → registered
trait → policy decision; appends the move and decision under the same lease/cursor check; and is
idempotent by request id.

The existing parser validation and profile-aware cache key survive as internal seam logic. The
browser sends only run/writer identity, expected node and idempotency key. Prediction, human split
and other evidence queries do not receive the persona transform.

## Literal production obligations

Invert all nine absent rows in the operation census:

1. run create profile reference;
2. exact-digest resume;
3. server-derived client operation;
4. sealed guard receipt;
5. sealed trait view;
6. non-test policy composition;
7. persisted decision record;
8. roster capability; and
9. grounded card projection.

Carry provider-off, guard-deadline, stale-node, duplicate-request, resumed-run and mismatched-digest
negative fixtures. A positive must prove the selected profile changes the executed non-test path,
not merely that a declaration or parser exists.

## Budget image

Declare sequential acquisition: the measured guard set is the Maia-admitted vector. Predeclare
combined p95 ≤400 ms as healthy/worry, >500 ms as intervention, and a 500-ms guard opportunity
deadline from selection start. An intervention receipt makes guarded/pawn profiles unavailable,
not baseline Play unavailable. Benchmark the exact release operation under expected concurrency
before profile registration completes.

The values are technical author inputs from the existing D969 p50/p95/max
209.085/286.796/499.1-ms result. They are not a claim of portable performance and can be returned
by the production benchmark; do not quote the observed maximum as a hard guarantee.
