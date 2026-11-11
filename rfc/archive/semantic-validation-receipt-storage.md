# RFC: Semantic validation receipt storage

- **Status:** implemented — 2026-11-11 after independent finite completion acceptance, full local verification and actual staged/first-parent controls.
- **Author:** codex, under the full-foundation/pre-launch zero-legacy rulings.
- **Created:** 2026-11-11
- **Parent / amends:** semantic-validation-authority.md §6; follows archive/semantic-validation-case-storage.md without changing its format.
- **Work:** [[D4220]], within [[D1716]].
- **Planning:** planning/foundation-source-identity/plan.md.
- **Exploration gate:** actual1928-case writer and lossless size measurement below.
- **Design refs:** design/02-product-shape.md appliance adoption; design/03-product-breadth.md grounded structural reading; ADR-0005.

```tabiya-claims
none
```

## Summary

Store each repeated ordered input-digest vector once in the generated validation JSON.
One build/test codec restores the unchanged complete schema1 execution document. The compact
runtime verdict module and all source/case/profile/qualification semantics stay intact.

## Implementation checkpoint — 2026-11-11

Committed in `03b584b4`. The complete 1,928-case receipt occupies 4,340,954 bytes with
461 exact ordered input vectors. Independent expansion reproduces the full pre-codec
document; all 1,524 earlier case receipts, operations/populations/externals and 84 other
verdicts remain exact. Five newly qualified outcomes belong to the parent source work.

Normal verification passes 20,488 software tests/580 files (742.34s), seven performance
tests/four files (57.73s), governance, types and build. Thirty-two codec/Git controls and
3,312 affected regressions pass. The actual repository staged and first-parent guards
pass; commit hooks typecheck the complete staged image. Independent completion review
accepts this finite storage implementation.

The actual current source-history tool decodes and preserves the committed storage2
receipt, then stops at the existing D3928 pack requirement: grade.move_quality1 versus2.
That whole target remains held; it is not reported green or waived. No content, ordinary
consumer, broader D1716 or release completion follows from this storage closeout.

## Motivation

The actual writer passes1928/1928 cases and24/89 subjects. Its12,750,264-byte JSON exceeds
the unchanged5MiB source limit. A largest case has66 targets, each repeating the same2312-byte
input list. Across the whole receipt there are461 unique ordered vectors. Replacing repeated
lists with exact indices measures about4.30MB while preserving every tuple. All1524 prior case
receipts, operations/populations/externals and84 unowned verdicts already compare unchanged.
The source-case parts themselves are bounded and do not change under this RFC.

## Specification

### One storage codec, one complete document

`packages/runtime/src/semantic-validation-receipt-storage.ts` owns encoding and decoding.
It is build/test-only, absent from the runtime barrel and application import graphs. It
accepts/returns the existing `SemanticValidationReceiptDocument` with `schemaVersion:1`.
It computes no chess fact, operation, case outcome, verdict or new digest.

The stored JSON has `schemaVersion:2`, the same other top-level fields, and one additional
`sourceDigestVectors` array. Each member is an ordered array of lowercase64-hex digests;
empty vectors are valid. Deduplicate entire vectors by exact value/order/multiplicity,
assigning indices in first case/target occurrence order. Do not sort or deduplicate a vector.
Each stored target replaces its `sourceDigests` array with `sourceDigestVector`, a safe integer
index into this table. All other target/case/document fields and array orders are unchanged.

The decoder rejects schema1 as current storage; unknown/missing top-level, case or target
fields; malformed dictionary/vector/digest shapes; duplicate or unreferenced vectors;
missing, negative, fractional, nonnumber or out-of-range indices; and targets containing both
representations. It expands the original `sourceDigests` arrays and removes storage-only
fields, returning schema1. Shared decoded vectors are immutable, so one read cannot poison
another target's inputs. It validates storage grammar, not a second set of chess semantics.
Other existing metadata remains governed by the canonical writer's existing checks.

### Writer, readers and historical evidence

`make semantic-validation-update/check` uses the codec's deterministic JSON serializer.
Retain the existing one-record-per-line case formatting. `receiptSha256` remains the SHA-256
of the exact stored JSON bytes: the hash algorithm is unchanged. `buildSemanticValidationReceipt`
still returns the complete schema1 in-memory document. `--check` recomputes and compares bytes
without writes. Only the ordinary writer rewrites generated files.

Reader census unit: **current direct JSON-reader files**, total **three**:

| File | Required reading |
|---|---|
| packages/runtime/src/foundation-semantic-event.test.ts | Decode current receipt before using full records. Its new24/13 qualification expectation belongs to the outcome wave, not this storage change. |
| packages/runtime/src/semantic-validation-receipt-storage.test.ts | Decode and round-trip the actual stored artifact, check its size and runtime hash. |
| tools/d3367-provider-source-history/proof.ts | Strictly decode the working receipt as storage2. Its previous Git receipt selects HEAD in CURRENT_HISTORY mode and a fixed BASELINE otherwise: use the sole decoder for a schema2 Git blob, and a confined historical schema1 read for a pre-cutover Git blob. |

`tools/d3367-provider-source-history/history.mjs` compares two fixed historical commits,
not the current artifact; keep that reader unchanged. A small tool-local history decoder
may handle the explicit Git-blob split; the runtime-storage codec itself never falls back.
Check fixed schema1 BASELINE, pre-cutover schema1 HEAD and post-cutover schema2 HEAD through
actual Git blobs. Unknown or mixed historical representations refuse. Audit all literal/
dynamic current receipt readers before claiming the census complete. Do not modify historical bytes.

### Bounds and scope

The stored full1928-case receipt must fit the existing5MiB guard. No limit increase,
omitted target/input/failure, sample, skip, weaker check, new raw recording, compression blob,
automatic eligibility waiver, resource lane, product schema or ordinary consumer change.
This private generated encoding is not exported as a shared versioned product resource.
Future size limits must fail visibly rather than discard records.

## Deviations from design

None. This changes generated representation only.

## Acceptance criteria

1. A real complete1928-case schema1 document round-trips exactly, including all array orders,
   every target/input vector, counts, failures, operations, populations, externals and verdicts.
2. Focused tests cover shared/empty vectors, vector order/multiplicity, immutable shared reads,
   no encoder input mutation, and each malformed/ambiguous/out-of-range form above.
3. All three current direct readers use the sole decoder; the historical-only reader is unchanged.
   Actual Git controls cover fixed schema1 BASELINE, pre-cutover schema1 HEAD and post-cutover
   schema2 HEAD. Current schema1 still refuses; history support is confined to the tool's
   explicit previous-Git read. No storage parser or generated JSON enters the runtime/application graph.
4. Actual stored output is below5MiB; the existing source guard and its negative tests pass.
5. The canonical check passes read-only with1928/1928 cases and24/89 subjects. This criterion
   validates storage of the outcome wave; storage itself grants no additional qualification.
6. All1524 predecessor case receipts, all old operation/population/external records, and84
   unowned verdicts remain exact. The only five new passing verdicts belong to the independently
   proved outcome sources. Hash metadata changes only where the stored bytes require it.
7. Normal types, relevant focused tests and complete software/performance/governance checks pass.
   The actual current reader and runtime admission/held-consumer boundaries remain checked.

## Discharges

none

## Open questions

None. Scope preserves complete execution evidence and the existing guard.

## Changelog

- 2026-11-11: drafted from the executed12.75MB receipt and measured461-vector deduplication.
- 2026-11-11: independent review returned the prior-reader assumption: CURRENT_HISTORY reads
  HEAD, which becomes storage2 after cutover. Added an explicit previous-Git split and actual
  pre/post-cutover HEAD controls without a current-format fallback.
