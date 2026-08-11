# RFC: Explanation Grounds (render what the system already computes)

- **Status:** accepted
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md` (compare and replay), `design/03-product-breadth.md` B4
- **Exploration gate:** breadth program #2, **fourth** scoping; answers the walkthrough finding with shipped data only
- **Depends on:** `rfc/archive/branch-runtime.md`, `rfc/archive/drill-client.md`, `rfc/archive/engine-workers.md`
- **Parent / amends:** **`rfc/archive/branch-runtime.md`** (compare payload gains a recorded-evidence overlay) and **`rfc/archive/drill-client.md`** (compare view rendering; `RunService.compare` gains the withholding gate)
- **Supersedes / superseded by:** — (the withdrawn `authoring-contracts-v03` / `evidence-composer` are *withdrawn*, a distinct terminal state; this RFC does not supersede them)
- **Planning:** `planning/explanation-grounds/`

## Summary

Close the walkthrough finding — *"branch comparison shows difference without
explaining consequence"* — using **only data the system already produces**:
render objective transitions through the evidence-sentence table that already
exists, and surface the Stockfish evidence already recorded per node in the
compare payload. Also closes a withholding hole the review discovered: today
`compare()` is ungated.

## Motivation

Three prior drafts were rejected and two RFCs withdrawn for specifying an
authored vocabulary with no authored content to design against. This one ships
only what shipped code can already feed, verified file-by-file.

**Verified shipped state:** `compare()` returns `objectiveTimelines` (entries
carrying `evidenceRefs`) and `checkpointHits`; `CompareView.svelte` iterates all
four arrays but renders raw state names; `evidence-sentences.ts` already holds
the full six-fact rules table plus `pack:` handling; `pack-orchestrator.ts`
mints `pack:<checkpointId>` refs; `evidence.attached` events carry Stockfish
payloads; `RunService.compare` performs **no** pack lookup and **no**
`feedbackIsRevealed` check, unlike `evidence()` and `applyEvidence()`.

**Deferred, and why (EG-C1/C4/C6):** grounding *objective types* in rules facts
(`win`/`hold`) is cut from this RFC. No shipped pack uses those types
(`content/packs/` is empty; the fixture is `play_until_checkpoint`), so it would
ship unexercised — the miniature of what killed the withdrawn RFCs. It also
cannot be done honestly today: `drawIsAvailable` collapses stalemate,
insufficient material, 50-move, and threefold into one boolean and cannot say
which fired, so a discriminated `rules:` ref is unmintable without a runtime
change this RFC declines to smuggle in. Revives with pack A.

Also out of scope: authored claims, timing windows, `provenanceMode`, feedback
packets, per-scope reveal, non-Stockfish sources, LLM rendering.

## Specification

### 1. Close the compare withholding hole (declared behavior change)

`RunService.compare` gains the same pack lookup + `feedbackIsRevealed` gate that
`evidence()` already applies. Today `objectiveTimelines[].evidenceRefs` travels
around the `publicEvents` barrier; that is an existing hole, not a status quo to
preserve. When feedback is withheld: `engine:` refs are stripped from timeline
entries and the overlay (below) is empty. Rules/pack refs are never withheld —
they are the objective machine's own grounds, not engine output.

### 2. Recorded-evidence overlay on compare (amends branch-runtime)

`BranchComparison` gains, per side:

```ts
evidence: [{ nodeId, plyOffset, evidenceRefs, kind, source, score }]
```

Assembled from **`evidence.attached` events on that branch's path** (durable
events only; `compare.ts` already walks both paths for the timelines and reuses
that traversal). `evidenceRefs` is carried so the client can join an entry back
to the sentence table (EG-C7).

**Score encoding, pinned (EG-C7):** the executor emits either `centipawns` or
`mateIn` (`evidence-queue.ts`). `score` is
`{kind: "cp", value} | {kind: "mate", movesTo}`, always **from White's
perspective** (matching the existing payload convention), and the client plots
mate scores at the axis extremes rather than converting them to centipawns.
Adding a field to `BranchComparison` breaks neither the typed client nor the
REST envelope.

### 3. Grounded rendering (client, amends drill-client)

- Objective timeline entries render `<from> → <to>` **plus** their refs through
  the **existing** `renderEvidenceRef`/`evidenceSentenceTable` — which already
  covers all six rules facts and `pack:` refs. Nothing is added to the table.
- **No "reason not recorded" branch** (EG-C3): empty `evidenceRefs` is
  impossible by three shipped invariants (`assertObjectiveTransition` throws,
  the run schema sets `minItems: 1`, `whyBanner` throws). The compare view
  adopts the same throw-on-empty policy rather than installing a second,
  friendlier one for identical data.
- The eval trajectory renders per side from the §2 overlay, aligned on
  `plyOffset`, with the fork ply marked.

## Deviations from design

`design/03` B4 lists the full evidence stack (Maia, corpus, Syzygy, LLM,
authored claims). This ships the Stockfish-and-objective subset that exists
today; **B4 stays unmet** and the rest is scheduled against real content.

## Acceptance criteria

- `compare()` returns the overlay for both branches, entries aligned on
  `plyOffset` and carrying `evidenceRefs`; a `mateIn` payload round-trips as
  `{kind: "mate"}`.
- **Gate test:** with feedback withheld, `compare()` returns an empty overlay
  and no `engine:` ref in any timeline entry; after reveal, both appear. (This
  is the hole being closed — the assertion fails against today's code.)
- Overlay entries derive only from `evidence.attached` events (asserted by
  comparing a run whose queue was drained but whose events remain).
- Client: timeline entries render grounded sentences via the existing table;
  eval trajectory aligns on `plyOffset` with the fork marked.
- **Playwright (mock-executor-safe, EG-C5):** in the existing two-branch
  walkthrough, the compare view shows a grounded objective sentence and an
  overlay entry for each side at the aligned fork ply. *No* delta assertion —
  `MockEvidenceExecutor` returns a constant 0, so a nonzero delta is
  unreachable under `make test-browser` by construction.
- **Docs updated in the same change (EG-C8):** `docs/branch-runtime.md`
  ("engine scores are not part of the comparison payload" — now false),
  `docs/drill-client.md` (withholding surfaces now include `/compare`).
- `ENGINES_REQUIRED=1 make verify` + `make test-browser` green.

## Open questions

None blocking. Objective-type grounding, `save`/`resist` support, authored
claims, and timing windows are content-era BACKLOG rows.

## Acceptance review blockers (2026-08-11 — EG-C1..EG-C8) — RESOLVED

C1/C4/C6 → §1 (objective-type grounding) **cut entirely**: unexercised by any
shipped pack and unmintable without a runtime change; deferred to pack A with
the reason recorded. C2 → the compare gate is now a **declared behavior
change** that closes an existing leak, not a claimed status quo; the
unreachable withheld-overlay criterion is replaced by a gate test that fails
against today's code. C3 → "reason not recorded" dropped in favor of the
shipped throw-on-empty invariant. C5 → browser criterion rewritten to what the
mock executor can produce. C7 → `score` encoding pinned (cp vs mate, White's
perspective) and `evidenceRefs` carried on overlay entries. C8 → docs updates
in acceptance, metadata corrected ("fourth scoping", RFC deps, both amend
targets, withdrawn≠superseded).

## Changelog

- 2026-08-11: created as breadth #2's fourth scoping, after withdrawing the
  composer and authoring-contracts RFCs.
- 2026-08-11: adversarial review EG-C1..C8; §1 cut, compare gate reframed as a
  declared fix, encodings pinned; **status → accepted**.
