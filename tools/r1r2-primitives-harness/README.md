# R1/R2 move-primitives harness — DISPOSABLE

Evidence instrument for **R1** and **R2** of `planning/campaign-research-queue.md`, permitted
under `rfc/0000-rfc-process.md` §Exploration gate. **Not production code**, not referenced by
`packages/` or `apps/`, not part of `pnpm test`. Results landed in
`design/research/move-primitive-computability.md`.

## Run

```
npx vitest run --config tools/r1r2-primitives-harness/vitest.config.ts
```

Writes `r1-output.md` and `r2-output.md` next to this file. Machine of record:
Apple M3 Max, Node v26.7.0 arm64, chessops 0.15.1.

## Files

| File | What it is |
|---|---|
| `corpus.ts` | Walks the 35 committed drill packs in `content/drafts/`, replays every spine node from its pack's `start.fen`, and yields 593 `(parentFen, moveUci, fen)` transitions with the authors' annotations attached |
| `primitives.ts` | The candidate transition primitives implemented over chessops. `lineBlockers` is a copy of `packages/runtime/src/structure.ts:401-410`; `capturedRole`/`irreversibility` are copies of `packages/runtime/src/pivotal.ts:32-57` (both private in the tree, so they had to be copied rather than imported). Everything else is new |
| `r1.test.ts` | Cost benchmark (median of 25 passes over the corpus) + firing census |
| `r2.test.ts` | Routing: recall against author-declared arrival squares, autonomous firing rate, discriminating power against legal alternatives. The `LABELS` table is a **transcription** of spine annotations, not a judgment about chess |

## Known limits

- Costs are single-threaded wall clock on one machine; the ratios between rows are the
  durable finding, not the absolute microseconds.
- `LABELS` is the exhaustive result of a vocabulary grep over the 35 packs
  (`regroup|reroute|redeploy|manoeuv|maneuv|retreat|reposition|heads for|...`). An author
  may have described a reposition in words the grep missed; absence of a label is not proof
  the move is not a reposition. Stated in the dossier.
