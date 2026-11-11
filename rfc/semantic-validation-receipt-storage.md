# RFC: Semantic validation receipt storage

- **Status:** draft — D4220 measured lossless input-vector deduplication.
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

Reader census unit: **current direct JSON-reader files**, total **two**:

| File | Required reading |
|---|---|
| packages/runtime/src/foundation-semantic-event.test.ts | Decode current receipt before using full records. Its new24/13 qualification expectation belongs to the outcome wave, not this storage change. |
| tools/d3367-provider-source-history/proof.ts | Decode its current receipt; retain the existing explicit historical schema1 read for its immutable prior revision. |

`tools/d3367-provider-source-history/history.mjs` compares two fixed historical commits,
not the current artifact; keep that reader unchanged. Audit all literal/dynamic current
receipt readers before claiming the census complete. Do not modify historical bytes.

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
3. Both current direct readers use the sole decoder; the historical-only reader is unchanged.
   No storage parser or generated JSON enters the runtime/application graph.
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
