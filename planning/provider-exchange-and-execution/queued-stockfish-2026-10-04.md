# Queued Stockfish evidence repair

The durable Stockfish executor now applies the completed main-line selection invariant from
`rfc/provider-exchange-and-execution.md` §5.1/§5.2 before returning its existing narrow packet.
This fixes D3374. It does not migrate the durable gateway to whole provider deliveries.

## Production behavior

The old executor took the last token match. New permanent controls reproduced twelve failures:
alternative MultiPV rows, bounded scores, lower-depth trailing iterations, missing or polluted
termination, and WDL/PV lines lacking a completed score could all become validated evidence.
One control reached the real SQLite worker and demonstrated `settled_success` for an alternate
line instead of an unavailable result.

The corrected executor accepts one scored, unbounded main-line iteration before the first
terminating `bestmove`. Depth jobs require exactly the requested depth. Movetime jobs retain
the greatest admissible depth, using arrival order only to break equal-depth ties. WDL and PV
must occur on their own completed scored iteration. Invalid output reaches the existing durable
unavailable path and produces neither a result page item nor an `evidence.attached` event.

The command profile, cancellation signal, reset flag, engine role, white score perspective,
side-to-move WDL perspective and public packet fields remain unchanged. The terminating bestmove
is retained independently of the PV's first move. There is no provider-off fallback, new sampler,
new cache, pack rewrite or schema migration. Previously persisted evidence is not rewritten.

## Remaining source migration

D3373 is blocked on `rfc/provider-exchange-and-execution.md`, owned by `evidence-foundation`.
The queued eval packet stores a terminating selection and permits configurable MultiPV. The
registered whole evaluation intentionally contains score/WDL only; its separate PV source is
bounded and is not the terminating selection. A complete migration must specify how to retain
that selection, request profile and durable authority. Dropping `bestMoveUci`, choosing the first
PV move or inventing a truncation limit would change behavior without a contract.

D3363's Inspector distribution and D3370's sampled Maia result remain separate gaps. Actual
consumer policy adoption, whole-manifest execution/digest, closed source resolution and public
availability also remain open. No whole RFC, capability or milestone closes.

## Verification

`make queued-stockfish-check` passes 58 tests across the real executor, durable store and
authoring consumers. The new target is a normal Make entry point; callers need no environment
prefix or changed testing parameters.

Complete exact-index software passes at `f32867a01e192a379a3e8ebd61eba6e21c619fc6`:
2,880 tests/325 files, seven isolated performance tests/four files, warning-free typechecks and
all downstream build, packaging, release-policy, value/source/history, lifecycle and migration
checks. The attached proof is `queued-stockfish-software-2026-10-04.json`. Source bytes remain
identical afterward; only documentation, results and tracking follow.

Real-content verification passes 223 tests/23 files, zero clearance errors and all 104 exact
requirement documents. All 885 capability declarations remain current and frozen, with no
metadata restamp or authored-content edit. The 352-document migration plan has zero rows.
Semantic validation remains 38/38 cases with zero fully passed profiles, not semantic validation
completion. Browser CI passes 111 journeys: 56 ordinary, five content, 49 matrix and one packaged
default, with one optional real-Maia latency skip and zero retries. Governance passes; final
exact-index process checks and normal hooks run before commit.

Ledger/work-state, queue, RFC/register, docs, anchored roadmap and the append-only exploration
log flow back in the same commit. The tracker has zero untriaged and 1,677 live items. Only D3374
closes; D3373 remains assigned and blocked on its source contract. No protected intent sentence
is altered or newly falsified. Unrelated shared edits remain excluded; no push, publication,
worktree or archive change. The full 1.0 goal remains active.
