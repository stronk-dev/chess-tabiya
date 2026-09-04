# Pack capability contract — thirteenth author repair

- **Date:** 2026-09-04
- **Repairs:** [[D2673]], [[D2674]], [[D2675]], [[D2676]], [[D2677]]
- **Gate:** `make pack-capability-thirteenth-author-repair` — complete retained chain plus 6/6
- **Verdict:** author repair complete; another genuinely fresh independent review required

## Repair

One SQLite-backed application operation now accepts only a branded run lease plus stored job id. It
loads the run image, settled job and request; joins run, node and FEN; parses the stored success;
invokes the registered immediate guard internally; derives the complete journal suffix; advances
the run CAS; consumes the same job; and stores its receipt in one transaction. Caller event, job,
settlement, revision and journal fields are absent and extra input keys fail.

Settlement accepts a branded job lease whose owner, generation and request digest were loaded from
the running row. It parses the success, checks all receipt fields in the update predicate, allocates
and increments the durable per-run sequence, clears the completed lease and settles atomically. A
spread lease fails before SQL; a stale real lease loses the CAS without consuming a sequence.

Idempotent batch replay loads every child and calls the complete stored-batch/run validator before
returning ids. Response-loss application replay re-joins the stored receipt to its retained event
range and digest before returning the prior result.

## Evidence and boundary

The six repair groups exercise internal guard output and extra-key refusal, a foreign node rollback,
incomplete success rejection, spread/stale lease refusal plus cleared fields, corrupted child replay,
and apply/consume/replay receipt validation. All predecessor author and falsifier targets remain
green. This is contract-tier evidence only; it changes no production or content byte and requires
another fresh independent review.
