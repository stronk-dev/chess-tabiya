# RFC: Explanation Grounds (render what the system already computes)

- **Status:** draft
- **Author:** claude (for Marco)
- **Created:** 2026-08-11
- **Design refs:** `design/01-training-model.md` (compare and replay), `design/03-product-breadth.md` B4
- **Exploration gate:** breadth program #2, third scoping; answers the walkthrough finding directly
- **Depends on:** `docs/branch-runtime.md`, `docs/engine-workers.md`, `docs/app-shell.md`
- **Parent / amends:** **`rfc/archive/branch-runtime.md`** — extends the `compare()` payload with a recorded-evidence overlay
- **Supersedes / superseded by:** supersedes withdrawn `rfc/authoring-contracts-v03.md` + `rfc/evidence-composer.md` for v1
- **Planning:** `planning/explanation-grounds/` (once implementing)

## Summary

Close the walkthrough finding — *"branch comparison shows difference without
explaining consequence"* — using **only data the system already produces**:
objective transitions with real grounds, the Stockfish evidence already recorded
per node, and the compare payload the runtime already returns. No new schema, no
authored vocabulary, no packet abstraction.

## Motivation

Three adversarial passes rejected the general explanation architecture
(withdrawn RFCs) for one root reason: it specified an authored vocabulary with
no authored content to design against. This RFC takes the opposite approach —
ship the concrete explanation the current data supports, use it, and let the
authored layer be designed later against a real pack.

**What the shipped code already has** (verified, not remembered):
`compare()` returns `objectiveTimelines` (entries carrying `evidenceRefs`) and
`checkpointHits`; `CompareView.svelte` already iterates all four arrays;
`pack-orchestrator.ts` mints `pack:<checkpointId>` refs into
`objective.state_changed`; `rulesEvidenceRef()` exists as a constructor;
`evidence.attached` events carry Stockfish payloads and `GET /runs/:id/evidence`
serves them.

**The three concrete gaps:**

1. Objective transitions decided by *rules facts* carry no grounds — the
   orchestrator's `successPredicate` recognizes only `reach_checkpoint`, so
   `rulesEvidenceRef` is never minted in production and "objective degraded"
   can appear with an empty explanation.
2. Engine evidence exists per node but never reaches the compare payload, so a
   comparison cannot say what the engine thought at the divergence.
3. The compare view renders raw state names (`degraded`) rather than grounded
   sentences.

Out of scope: authored claims and their triggers, timing windows, `provenanceMode`,
feedback packets, per-scope reveal, non-Stockfish evidence sources, the LLM
renderer. Each returns when it has something real to be designed against.

## Specification

### 1. Rules-grounded objectives (server)

Extend the orchestrator's pack→rule translation beyond `reach_checkpoint`:

| `objective.type` | v1 rule | minted ref |
|---|---|---|
| `reach_checkpoint` | unchanged | `pack:<checkpointId>` |
| `win` | `rulesFact: checkmate` with `winner` = the drilling side | `rules:checkmate` |
| `hold` | `rulesFact: draw` (the shipped `drawIsAvailable`: stalemate, insufficient material, 50-move, threefold on the path) | `rules:draw` |

`save` and `resist` stay unsupported in v1 — they require judging *practical*
difficulty, which no shipped component computes. Packs declaring them are
rejected at registry load with the existing typed `PACK_INVALID` (the same
refuse-to-serve pattern as unsupported policy modes), so a pack never silently
half-works.

### 2. Recorded-evidence overlay on compare (runtime, amends branch-runtime)

`compare(run, a, b)` gains, per side, `evidence: [{nodeId, plyOffset, kind,
source, values}]` assembled **from `evidence.attached` events on that branch's
path** — durable events only, never the in-memory queue. No new event type, no
run-schema version change: this reads what the log already stores.

Subject to the **existing** run-global reveal gate (`feedbackIsRevealed`): if
feedback is withheld, the overlay is empty exactly as `publicEvents` already
redacts. v1 changes no reveal semantics.

### 3. Grounded rendering (client)

- Objective timeline entries render as `<from> → <to>` **plus** their refs
  through the existing `evidence-sentences.ts` table ("Draw available:
  threefold repetition on this path"), not bare state names.
- An entry whose `evidenceRefs` is empty renders "reason not recorded" — an
  honest gap marker, and a signal that §1 missed a case.
- The compare view shows the eval trajectory per side from the §2 overlay,
  aligned on `plyOffset`, with the fork ply marked.
- The sentence table gains entries for `rules:checkmate` and `rules:draw`.

## Deviations from design

`design/03` B4 lists the full evidence stack (Maia, corpus, Syzygy, LLM). This
ships only the authored-free subset that exists today; B4 stays unmet and the
rest is scheduled against real content. Declared, not hidden.

## Acceptance criteria

- A run reaching a drawable position under a `hold` objective emits
  `objective.state_changed` carrying `rules:draw`, and the UI renders the
  sentence (the end-to-end case that today produces an empty explanation).
- A pack declaring `save`/`resist` is refused at registry load with
  `PACK_INVALID` (+ test).
- `compare()` returns the evidence overlay for both branches; a test asserts
  the overlay is empty while feedback is withheld and populated after.
- Overlay entries derive only from `evidence.attached` events (asserted by
  composing a run whose queue was drained but whose events remain).
- Client: timeline entries render grounded sentences; an entry with no refs
  renders "reason not recorded"; eval trajectory aligns on `plyOffset` with the
  fork marked.
- Playwright: in the existing two-branch walkthrough, the compare view shows at
  least one grounded objective sentence and an eval delta across the fork —
  the walkthrough's finding, closed and observable.
- `ENGINES_REQUIRED=1 make verify` + `make test-browser` green.

## Open questions

None blocking. `save`/`resist` support, authored claims, and timing windows are
BACKLOG rows tied to the content era.

## Changelog

- 2026-08-11: created as breadth #2's third scoping, after withdrawing the
  composer and authoring-contracts RFCs. Every dependency in this draft was
  read in the shipped code before being cited.
