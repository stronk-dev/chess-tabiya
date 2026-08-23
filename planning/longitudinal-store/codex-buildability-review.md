# Longitudinal store — Codex buildability review

- **Reviewed:** 2026-08-23
- **Input:** `rfc/longitudinal-store.md` at `0d7c2d4`
- **Verdict:** **RETURN TO AUTHOR / REGISTER OWNER**
- **Scope:** event-population closure, deterministic time identity, incremental cost, exact
  drill-down identity, revision discipline and lifecycle state.

The per-run projection grain, owner attribution and played/game/predicted split are the right
foundation. The accepted label is not buildable yet. Three questions explicitly required before
acceptance remain unanswered, the declared ingest set is 67 families while the specified compiler
can produce at most 46 of them, and the synchronous whole-run write path repeats a complete
legal-alternative census after every mutation without a latency measurement.

## Acceptance blockers

### B1 — The accepted state contradicts the RFC's own acceptance boundary

The status says `accepted` and, in the same paragraph, says three open questions resolve before
implementation. The preserved prior verdict says they resolve before `accepted`; every question's
own final sentence agrees. They determine the v1 ingest set, whether unmeasured bulk-import cost is
accepted, and who owns future semantic revision bumps. This is already ledgered as D973/D1011 and
has not been resolved.

**Required action:** record all three answers in place or return the RFC/register row to draft.
Implementation cannot silently turn proposals into product policy.

### B2 — Twenty-one registered event families are unreachable through the specified compiler

Section 3 ingests set-equal `SEMANTIC_EVENT_PROJECTION_IDS`; at HEAD that set has **67** members,
not the RFC's 40. Section 4.2 computes each edge with `localSemanticEvents`. Its literal composition
at `semantic-evidence.ts:919-922` cannot produce:

- 11 structural + 2 tactical `derived.semantic_avoidance.*` families — avoidance is a relation over
  the complete alternative population, constructed inside selection, never an event on one edge;
- `derived.exchange.trade_completed` — a two-edge recorded sequence;
- seven observed multi-edge Wave-C families (deflection, attraction, both clearance forms,
  interference, check zwischenzug and overload exploitation).

The two one-edge Wave-C duty events do enter through `semanticDutyEvents`; the other seven do not.
Thus the named compiler can reach at most **46/67** registered members. Most seriously, all 13
avoidance families that motivate opportunity-normalized skills are structurally zero.

**Required amendment:** split the ingest registry by constructor shape. One-edge edge events,
complete-population avoidance relations and recorded-path sequence events need separate adapters
and exact source identities. Add a set-equality closure test from each admitted id to a live
constructor; do not follow the broad catalogue symbol blindly.

### B3 — `derived_at` makes byte equality or longitudinal time windows undefined

Both tables require `derived_at`, and the read contract exposes `since` as a lower bound on that
column. The derivation is declared a pure function of run bytes, attribution, catalog and rev; no
clock or derivation-time rule is specified. If `derived_at` is wall-clock time, AC-4/AC-5
byte-equality fails on every rebuild. If a rebuild rewrites it to the rebuild time, every old game
becomes recent and the eight-week/early-vs-late consumers are corrupted. If it means run/event time,
that durable operand and exact selection rule are absent.

**Required amendment:** add an immutable observation-time operand derived from a named durable run
event/source-game timestamp, use it for windows, and define `derived_at` deterministically or remove
it from persisted semantic rows. Include a rebuild-at-a-later-clock fixture proving window results
and bytes do not move.

### B4 — The “rev must bump” fixture can pass when the ingest set changes

AC-11 pairs the output digest of one fixture corpus with `OBSERVATION_DERIVATION_REV`. Section 4.4
claims any ingest-set change changes that digest. A newly registered rare family that does not fire
on the fixture changes the set and produces byte-identical output, so the check stays green without
a rev bump. This is especially likely for the observed multi-edge families the current compiler
never reaches.

**Required amendment:** bind the rev to both the canonical derivation-fixture digest **and** the
literal admitted-ingest registry/constructor-contract digest. A set member added, removed or
reversioned must fail even at zero incidence.

### B5 — Prediction drill-down identity is weaker than the decision identity

Section 4.2 defines one prediction decision per `(nodeId, checkpointId)`. Section 2 stores
`occurred_refs` and `opportunity_refs` as arrays of node ids and calls them exact drill-down. Two
checkpoints on one node can therefore produce two decisions with the same stored ref; the row
cannot reopen which prediction/checkpoint contributed, and duplicate JSON strings do not restore
that identity.

**Required amendment:** store a closed typed decision reference containing decision class plus the
class-specific identity (`nodeId` for played/game; `nodeId + checkpointId + prediction event seq`
for predicted). Validate and canonically order it rather than storing untyped string arrays.

### B6 — The synchronous incremental path has unmeasured quadratic replay cost

Every run mutation calls whole-run `projectObservations`, and every decision enumerates all legal
alternatives and calls `localSemanticEvents` for every edge. Repeating a full-prefix projection
after move 1, then moves 1–2, then 1–3 gives quadratic decision replay before collector cost. The
closest committed measurement (D1066) found complete-alternative semantic selection at mean
329 ms per searched edge before the latest breadth additions; this RFC supplies no move-latency,
long-run or import-throughput gate. Open question 2 measures stored refs bytes only and misses the
synchronous compute term.

The statement that no request observes a mid-replace store does not address a request blocked for
seconds by the derivation itself.

**Required research before implementation:** preregister 20/40/80-ply native runs plus a fixed
bulk-import corpus; report per-mutation p50/p95/max, total replay work, rows and refs bytes. Then
choose incremental per-decision append/upsert, close/background projection, or a measured bounded
whole-run path. The rebuild remains authoritative whichever write schedule wins.

### B7 — The register and symbol receipt are stale at the implementation boundary

The RFC and register say HEAD storage version 24; committed HEAD is 25 after learner-rating. That
does not invalidate the relative `behind learner-rating` claim, but it proves the acceptance receipt
was not refreshed after its prerequisite landed. The RFC also cites the prediction pack gate at
`service.ts:1204`; D1303 re-derived it at `#requiredRegisteredPack` around 1512–1514 and found zero
authored prediction packs.

**Required action:** refresh every named implementation symbol and the migration/register receipt
at the same HEAD used for implementation. Cite the pack gate by symbol, not line.

## What survives unchanged

- per-run rows rather than mutable cross-game totals;
- learner + run + projection version + phase + decision-class grain;
- owner-only attribution for shared runs;
- `opportunities > 0` and `occurred <= opportunities` schema checks;
- hard deletion cascades and no cross-learner read;
- rebuild as authority, with deliberately red tamper/missing-run fixtures;
- no prose, style label, skill tier, rating input or LLM output in storage.

Those decisions are why this RFC is worth repairing rather than replacing.

## Required author receipt

Before re-acceptance:

1. answer OQ1–OQ3 explicitly;
2. publish an admitted-ingest registry with constructor set-equality and the 67→adapter split;
3. pin immutable observation time and typed decision refs;
4. bind rev to registry + derivation output;
5. land the latency/scale research result and choose the write schedule from it;
6. refresh register/symbol claims at HEAD;
7. rerun buildability review before any migration or production derivation code.
