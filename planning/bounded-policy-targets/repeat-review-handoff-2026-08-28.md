# Bounded-policy targets — repeat-review handoff

**Prepared:** 2026-08-28
**Document:** `rfc/bounded-policy-targets.md`
**Prior return:** `repeat-independent-buildability-review-2026-08-27.md`

## Review posture

Perform a fresh independent buildability review. Do not inherit the author's claim that
[[D1904]]–[[D1909]] are repaired, and do not accept the RFC merely because both disposable targets
are green. Acceptance still belongs to the independent reviewer.

## Exact checks

1. Transcribe all three §3 F1 rows and compile them through the shipped manifest. Verify weakest
   grounding and exactness as well as confidence; do not weaken the compiler.
2. Attempt to join a valid threat/exchange to a legal-move item from a different original FEN,
   including halfmove/fullmove and en-passant differences. The source authority must be sealed and
   the registered pass transform must be the only source→passed bridge.
3. Compile the §4 aliases and request/result union against the actual exported
   `DeclaredEvidence<T>`. Swap every input projection in turn. A double assertion is not a valid
   application path, but runtime projection checks must still refuse it.
4. Enumerate every `ImmediateTargetOutcome` pair. Verify observed legal attacker/victim captures
   take precedence and that `identity_lost` cannot overlap them.
5. Force the 25,000-position cap and cancellation. Neither arm may seal
   `bounded_return@1` or expose a partial boolean, witness or refutation.
6. Re-run `make bounded-target-contract` and `make bounded-target-census`. Audit the committed
   timing receipt, the 512-pair refusal, and the assertion that fixed populations remain outside
   the request-thread envelope.
7. Attack the execution claim: locate any proposed Support gesture, hover, commit, HTTP route or
   bot loop that could call the traversal inline. `local/background` must be a real consumer
   prohibition, not metadata beside a synchronous call path.
8. Confirm the implementation scope can rerun the census through production symbols without
   introducing a server/web consumer. All three projections must remain `inspector_only`.

## Author evidence, not reviewer conclusions

- `make bounded-target-contract`: 14/14 on 2026-08-28.
- `make bounded-target-census`: 11/11 on 2026-08-28.
- Max target×candidate pairs: 111 authored, 333 imported.
- Whole-position maxima: 1,305.12 ms authored, 993.43 ms imported.
- Research receipt: `design/research/bounded-target-execution-closure.md`.

Any discrepancy is a return. Record new findings as new ledger rows before changing the RFC.
