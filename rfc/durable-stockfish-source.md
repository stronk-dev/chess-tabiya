# RFC: Durable Stockfish task source

- **Status:** draft — source and durable-format amendment for [[D3373]]; not implementation authorization
- **Author:** codex
- **Created:** 2026-10-08
- **Design refs:** `design/03-product-breadth.md` (one evidence foundation for Play, Review and rehearsal); `design/05-in-run-experience.md` (disclosure and explicit Inspector); ADR-0005 (render evidence, never manufacture chess judgement)
- **Exploration gate:** implementing `provider-exchange-and-execution.md` §§5/10, the located [[D3373]] contract gap and `planning/provider-exchange-and-execution/queued-stockfish-2026-10-04.md`; existing completed-iteration and terminating-selection controls in `apps/server/src/evidence-queue.test.ts`
- **Depends on:** `provider-exchange-and-execution.md`; `provider-protocol-register.md`; `evidence-job-durability.md`; `evidence-value-authority.md`
- **Parent / amends:** the durable Stockfish gateway in `evidence-job-durability.md`; adds a source alongside, not in place of, provider exchange §§5.1/5.2
- **Supersedes / superseded by:** —
- **Planning:** existing `planning/provider-exchange-and-execution/`; no second delivery queue

```tabiya-claims
provider-protocol | members stockfish_analysis_task_v1 | same-task mainline, actual terminating selection and configured MultiPV for durable jobs
migration | position behind native-ratings | stamp-only storage upgrade before v2 evidence job/batch/settlement writes; no column or historical rewrite; ordering provisional pending fresh review
```

## Summary

Replace the durable worker's private raw Stockfish request with one shared, sealed
`stockfish.analysis_task@1` operation. Preserve the requested MultiPV, purpose, search bound,
completed main-line result and actual terminating selection from **the same task**. Persist its
provider delivery alongside the existing narrow result, reconstruct it on reads, and require the
narrow result to equal its registered derivation. Preserve historical jobs without fabricating
provider evidence. No new move ranking, explanation, hint policy or content migration is involved.

## Why a distinct source

The worker's eval packet carries `bestMoveUci`. The existing position-evaluation operation does
not carry a move; the bounded principal-variation operation truncates its line and is not the
terminating move authority. Both force MultiPV 1, whereas the durable request can override the
configured width. The existing regression deliberately reports one PV first move and a different
terminating `bestmove`; the executor correctly preserves the latter. [V: `evidence-queue.ts`,
`evidence-queue.test.ts`, provider exchange §§5.1/5.2]

Stockfish 18 emits completed `info` and terminal `bestmove` through separate callbacks; WDL is
conditional on its option. This supports retaining separate operands, not asserting that they
are interchangeable. [P: [Stockfish 18 UCI implementation](https://github.com/official-stockfish/Stockfish/blob/sf_18/src/uci.cpp)]

The new source describes a **main-line result under the requested search configuration**, not
an all-legal candidate table. Requested MultiPV does not prove that every rank or every legal
move was returned. The existing all-legal root operation remains the authority for that claim.

## Specification

### 1. Exact operation and request

Add one member and its operation-keyed maps, descriptor, parser, source factory and CLI arm to
the existing provider resource. Reuse the same scheduler, supervisor, digest domains, same-task
capture, deadlines, cancellation, generation checks and retention. No new pool/cache or resource
tracking mechanism.

| identity | value |
|---|---|
| operation | `stockfish.analysis_task@1` |
| parser | `parse.stockfish_analysis_task@1` |
| whole source | `live.stockfish.analysis_task@1` |
| factory | `createLiveStockfishAnalysisTaskV1Evidence` |
| CLI | `stockfish-analysis-task` |
| provider / endpoint | `stockfish` / existing `stockfish-analysis` supervisor |

```ts
interface StockfishAnalysisTaskRequest {
  readonly fen: string; // canonical six-field standard-chess FEN, clocks retained
  readonly requestedEngine: { readonly id: string; readonly version: string };
  readonly bound:
    | { readonly kind: "depth"; readonly requestedDepth: number }
    | { readonly kind: "movetime"; readonly requestedMs: number };
  readonly purpose: "eval" | "wdl" | "bestline";
  readonly multiPv: number;
  readonly timeoutMs: number;
}
```

All numeric request values are positive safe integers. The descriptor checks requested width
against the actual engine option range; it neither clamps nor substitutes a width. Depth and
movetime are exclusive. Nodes, arbitrary options, caller commands, searchmoves, ponder searches,
caller source identity, caller generation and caller response digests are refused. `purpose` is
part of request identity: it controls WDL and the selected-iteration eligibility rule below.

The normalized command image preserves the durable gateway's current command order:

```text
setoption name UCI_ShowWDL value <true only for purpose wdl; otherwise false>
setoption name MultiPV value <multiPv>
position fen <canonical six-field FEN>
go depth <requestedDepth> | go movetime <requestedMs>
```

The descriptor owns those commands and their digest. Restore MultiPV 1 and UCI_ShowWDL false,
then complete the existing ready fence on every exit before reusing the supervisor. Preserve the
job's actual timeout/default calculation; this RFC creates no new deadline or cost budget.

### 2. Result and parsing

```ts
interface StockfishAnalysisTaskResult {
  readonly request: StockfishAnalysisTaskRequest;
  readonly scoreFrame: "root_side_to_move";
  readonly mainline: {
    readonly depth: number;
    readonly rank: 1;
    readonly score:
      | { readonly kind: "centipawns"; readonly value: number }
      | { readonly kind: "mate"; readonly value: number; readonly unit: "moves" };
    readonly wdl: { readonly win: number; readonly draw: number; readonly loss: number } | null;
    readonly rawPvUci: readonly string[];
    readonly canonicalPvUci: readonly string[];
  };
  readonly termination: {
    readonly rawBestMoveUci: string | null;
    readonly canonicalBestMoveUci: string | null;
    readonly rawPonderUci: string | null;
    readonly canonicalPonderUci: string | null;
  };
}
```

The whole evidence payload is the existing
`ProviderEvidenceDelivery<StockfishAnalysisTaskResult, "stockfish.analysis_task@1">`, not the bare
result. Actual engine/binary/options/generation and the captured transcript live in the shared
acquisition image; do not manufacture duplicate actual identity from the request.

Parsing starts at this task's position command and ends at its first terminal bestmove. Later
output, missing/malformed termination, output from a different task and a crossed request refuse.
Select exactly as the current `completedInfo` does:

1. Consider only info lines with rank 1 (explicit or omitted), a non-negative safe-integer depth
   and an unbounded safe-integer cp or non-zero signed mate score.
2. For `wdl`, the **same info line** must carry three integers in 0–1000 summing to 1000.
   For `bestline`, that same line must carry a non-empty PV. An eval does not require WDL or PV.
3. Depth requests select the last eligible line at exactly the requested depth. Movetime requests
   select greatest eligible depth, with latest arrival resolving equal depth. Do not assemble
   score, WDL or PV from different iterations. Other ranks and bounded rows cannot replace rank 1.
4. WDL is null if absent on the selected line, never reconstructed. If present it must be valid,
   even for a purpose that does not require it. PV is empty if absent, never filled from bestmove.
5. Normalize every reported PV move by replay from the request FEN, retaining the original tokens
   and the equal-length canonical king-takes-rook sequence. The full reported PV is retained;
   no arbitrary maxPlies or default truncation is introduced. Illegal/malformed continuations
   refuse, including when the purpose did not require a PV.
6. Normalize terminating bestmove independently at the root, and ponder independently after
   that move. They need not equal the selected PV prefix. A null bestmove is lawful only for a
   rules-terminal root with no legal moves; ponder then must be null. `0000` and `(none)` become
   null, not a playable move. Keep the same completed-info eligibility even at terminal roots:
   mate-0 refuses, an exact-depth request still requires that depth, and bestline still requires
   a PV. Do not assume every terminal task succeeds or every terminal task fails; test checkmate
   and stalemate separately under both bounds. No new terminal scoring convention is introduced.

The parser does not infer intent, causality, forced defense, human likelihood or move quality.
Mate remains signed moves in the root frame, never centipawns. A returned PV is an engine line,
not an all-defenses proof. Store the selected line index and terminal line index in the parser's
existing source-validation material if needed; do not expose extra unbound caller metadata.

### 3. Sole narrow adapter and presentation boundary

One new registered machine-only consumer `runtime.queued_stockfish@1` admits the whole source with
required-source `operation_unavailable`, then derives the existing payload:

| purpose | exact narrow derivation |
|---|---|
| eval | White-perspective cp or signed mate from mainline score; `perspective: white`; terminating canonical bestmove when non-null; reached depth |
| wdl | selected line's side-to-move win/draw/loss unchanged; reached depth |
| bestline | selected line's full **raw** PV tokens unchanged; reached depth |

All three keep the existing engineId and requestedDepth/requestedMovetimeMs fields. The bestline
mapping intentionally preserves historical packet bytes while the whole source additionally
provides canonical legal operands. Do not silently change existing castling spellings in packets.
The terminating selection and the PV remain independently attributed even if they agree.

No ordinary module/voice consumer admits this whole source. It contains moves, values and PV;
being collected does not authorize showing it. Existing narrow packet and explicit Inspector
ceilings remain. New engine explanations consume separately accepted derivations, not this RFC.

### 4. Durable request and settlement compatibility

Current `parseEvidencePayload` and success settlement use exact keys. Adding delivery bytes to
`values` or broadly relaxing those parsers is prohibited. The following two format arms make the
migration explicit, using the existing JSON columns and lease/settlement transaction:

- Keep frozen `evidence_job_request@1` and its exact legacy success settlement reader.
- New Stockfish admissions write server-owned `evidence_job_request@2`: the same closed v1
  field set, with `schema` changed to that literal, plus
  `stockfishSource: { operation: "stockfish.analysis_task@1", multiPv: number }`. It is required for
  eval/wdl/bestline and refused for tablebase. The effective width is resolved once at admission
  from explicit job width or the configured default, then pinned. The HTTP caller cannot set
  this discriminator or submit a source/delivery. Depth, movetime, purpose and timeout derive
  from the same stored request; request digest includes the new arm and width.
- Keep frozen `evidence_batch_request@1`, whose jobs are all v1. Fresh batches write
  `evidence_batch_request@2`, with the same closed outer keys and the same 1–16-job/run/origin
  checks. Its engine jobs must be v2 and its tablebase jobs remain v1. This is an exact
  kind/version dispatch, not an arbitrary mixed-version escape hatch. The existing digest
  domain hashes the canonical versioned image; the v1 digest and parser remain unchanged.
- A v2 success settlement has exactly the existing four keys plus
  `providerSource: { operation: "stockfish.analysis_task@1", delivery: <serialized shared delivery> }`.
  It is required, not optional. A v1 success has exactly its existing four keys. Presence cannot
  upgrade a v1 job, and deleting providerSource cannot downgrade a v2 job.
- On settlement **and every stored read**, parse the delivery through the shared persisted-delivery
  authority, admit it through the source factory and registered consumer, match the complete
  request to the durable job and recompute the narrow payload. Require byte equality with the
  stored payload. Then perform the existing job/lease/acquisition/payload/proposal checks.
  Corrupt/missing/crossed modern source is `EvidenceJobCorrupt` / `STORAGE_FAILURE`, not absence.
- The stored source is machine-only. Existing result pages and attached run events continue to
  contain their unchanged narrow packets, not unfiltered whole deliveries. An authenticated
  recorded-source resolver derives the job from the readable run's actual attached reference,
  checks current access and occurrence membership, and reads the modern consumed settlement.
  No public arbitrary job/digest lookup is added.

The v2 request/batch/settlement remains server-owned, as the predecessor durable job grammar is.
There is no new SQL column, run-schema field, pack-schema field, evidence kind, digest domain or
content version. There **is** a stamp-only storage migration: writing a format the preceding
binary cannot read must not leave the database at that binary's supported storage version.
Use the existing prepare-start snapshot/journal/rollback workflow. Take the next contiguous
number only at landing; the provisional registered position is behind `native-ratings`, not a
reserved integer. Review must settle this ordering before implementation; it cannot silently
move other claims to make the source ready sooner. The migration rewrites no historical job or
batch. Older binaries refuse the upgraded database; rollback uses the verified pre-upgrade
snapshot, not a lowered PRAGMA or a rewritten modern job. Both JSON versions are included in
backup/export/restore validation. If another schema change is needed, return the draft rather
than claiming an unregistered lane.

**Historical behavior:** v1 settled/consumed rows remain readable with the exact old payload,
acquisition and application receipt. They are legacy packets, not shared source evidence. No
backfill can manufacture their missing transcript. A pending v1 job may execute through the new
descriptor but settles as v1, deriving its old effective width at execution as before; it must not
emit or expose a reconstructed modern settlement. No private raw engine path remains necessary.

**Idempotent admissions after upgrade:** look up the caller's existing batch/request identity
under its actual principal before allocating new work. Compare the submitted job intent through
the stored version's parser; an unchanged v1 replay returns the original batch and allocates
nothing. Never reconstruct a v1 request as v2 merely to compare digests. Changed jobs still refuse.
Fresh batches use the v2 kind/version dispatch above. A replay compares submitted intent to the
stored batch's job versions and preserves their order; it never allocates a replacement before
that comparison. Retrying a v2 job retains its pinned width despite a changed application
default. Existing job origins, lease generations, cancellation, staged-result cursors, objective
upgrades and exactly-once consumption do not change.

### 5. Production adoption

Scope is the one durable Stockfish gateway, not every engine consumer. Unit for this table:
**six execution/persistence boundaries**; implementation proof must cross all six.

| boundary | required adoption |
|---|---|
| application composition | one new descriptor in the existing scheduler; current actual engine identity |
| new admission / replay | v2 pinning and frozen v1 idempotency, no client authority |
| queued acquisition | `StockfishEvidenceExecutor` uses the shared operation, no private execute/second scheduler |
| settlement / stored read | exact shared-source reconstruction and narrow derivation equality |
| consumption / authorized recorded resolution | unchanged narrow attachment plus source retained in consumed job |
| restart / account export / backup restore | both historical and modern format arms, corruption remains refusal |

Do not mark the parent provider RFC complete, migrate Maia, rewrite authored packs or invent
Inspector semantics as part of this change. D3370, D3363, D3376, D3309 and full source availability
remain independently owned. Public declarations and the provider resource advance through normal
append-only registration, preserving all six existing operations and every old source meaning.

## Acceptance criteria

1. All seven exact operation/parser/factory/CLI tuples agree. No hand-maintained second operation
   inventory, unclaimed member or raw result accepted as a delivery.
2. Real Stockfish traverses descriptor → shared scheduler → parser → sole factory → consumer;
   pinned depth and movetime arms run with width 1 and a supported width greater than 1. Actual
   configured-range, version, generation and request/FEN-clock substitutions refuse.
3. The existing mismatched-PV/bestmove control preserves both operands; no test makes them equal
   by construction. Castling/promotion and full legal PV controls include a line longer than the
   separate PV operation's default ceiling. No truncation or first-PV selected-move substitution.
4. Exact-depth, greatest-depth/latest-arrival, alternate-rank, bound, mixed-iteration, malformed
   WDL, missing/late termination and terminal/no-move controls are able to fail independently.
   Keep the predecessor controls; no deadline/threshold/purpose/population weakening.
5. All three narrow purposes preserve existing valid packet bytes for both bounds and widths.
   Malformed newly validated operands refuse with the existing origin-specific failure algebra;
   a broader rejection is not reported as unconditional byte equivalence.
6. Authenticated HTTP/SQLite proves new v2 admission, v1/v2 idempotency, pinned width after changed
   configuration, source failure, cancellation, supersession, lease expiry and restart/retry.
   No failed source commits an engine evidence event or triggers a bare fallback.
7. Real stored-read negatives independently alter/remove operation, delivery, root clocks,
   engine identity, width, purpose, score, WDL, PV, terminating move and narrow payload. Every
   counterfeit v2 settlement refuses, including deletion of its source. Valid v1 history remains.
8. Exactly-once staged consumption, objective upgrade, pending/consumed export and backup/restore
   pass for both formats, including mixed engine/tablebase v2 batches and frozen v1 batch replay.
   Prepare-start snapshots and advances the storage stamp; the preceding binary refuses the
   upgraded database and verified pre-upgrade restoration recovers its exact legacy jobs. No
   historical job gains a delivery or changes its original receipt.
9. A readable run can resolve its actual modern attachment; strangers, revoked grants, crossed
   runs/branches/nodes, unattached jobs and stale/crossed references cannot. Legacy attachments
   return explicit legacy-source absence, never a newly minted source.
10. Browser explicit analysis and Inspector still obey disclosure/assistance ceilings. New source
    internals never enter public result pages, ordinary Support or the external voice allow-list.
11. Current tests, types, content, governance, packaged build and relevant browser journeys pass
    through normal Make targets. Native operation tests are mandatory, not an optional mock-only
    substitute. Failure traces stay bounded/local; no bulk recording is a progress dependency.

## Deviations from design

None. This closes an evidence-source and durable-adoption gap without changing learner policy.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Whole same-task Stockfish source and all keyed registrations | `durable-stockfish-source` | native shared-source and substitution tests | |
| D2 | Modern durable admission/read/consumption and historical compatibility | `durable-stockfish-source` | authenticated SQLite/restart/export/restore controls | |
| D3 | [[D3373]] queued raw caller retirement without selected-move or MultiPV loss | `durable-stockfish-source` | all six production boundaries and normal verification | |

## Open questions

No new owner product choice is proposed. **Fresh contract review is required before acceptance**,
especially request/batch-v2 replay, the provisional migration ordering, source deletion/downgrade
refusal, legacy pending jobs and recorded source access. A source/storage mismatch returns to
author; it does not authorize a permissive
parser. This draft is not accepted by its own tests or by a green register.

## Changelog

- 2026-10-08: draft the missing same-task source and complete durable migration for D3373;
  preserve separate terminating selection/PV, configured width, frozen history and disclosure.
