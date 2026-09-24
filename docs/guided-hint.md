# Guided Hint

Guided Hint is the learner module for "I am stuck, show me the least that helps." It is implemented
from `rfc/hint-distance.md` (Checkpoint A, 2026-09-24). This page describes what exists in the tree.

## What a learner sees

Guide me and Support include `guided_hint`. When the server-compiled preset carries the module under
a ceiling other than `off`, the run's Support region shows a seat headed **Ask for the least that
helps**. It has one button: **Hint**. After the first answer the button reads **A little more**.
There is no rung or source picker in ordinary play.

The seat never asks on its own. The learner has to press the button, and the request only runs when
the run's disclosure boundary is open, for example after **Show support for this position** in Just
Play. When the boundary is closed, the seat says so instead of showing a hint.

Each press reveals one more rung for the current decision:

| rung | what the learner reads | board marks |
|---|---|---|
| pattern | "A ⟨engine⟩ search from here (⟨bound⟩) finds ⟨a double attack⟩ for you." | none |
| square | adds "It involves d1 and d3." | lit target squares |
| piece | adds "The piece involved is your knight on a4." | adds a halo on that piece |
| distance | adds "It appears after this move." or "It appears on your next turn in this searched line." | same marks |
| move | adds "The searched line starts with Nb2." | adds one arrow |

A commit, rewind, fork, cursor change or boundary change is a new decision, and the ladder starts
over. When the searched line gives nothing to hint at, the seat says so and suggests playing the
move and looking at the consequence. It never falls back to showing an engine move. When the
analysis engine is unavailable, the seat says that too; theory and structure help keep working.

## Ceiling (D1639, proposed)

The effective ceiling is the minimum of the preset, the workflow context and access
(`hintCeiling` in `packages/runtime/src/presets.ts`). It uses the `HINT_CEILING_TABLE` values from
`rfc/hint-distance.md` §5, which are still marked `validation: "proposed"`. Under that table,
Guide me and Support stop at `distance`, so they never reveal the move in ordinary play. Match and
spectators get `off`. Whether a source is available never lowers the ceiling. If the source is
missing, the answer is an honest `source_unavailable`.

The stored Advanced `hintDistance` preference (`AssistanceConfig` v5, D12) is not implemented yet.
Until it lands, the stored-preference term of the minimum is simply absent.

## How a hint is built

1. **Registry** (`packages/runtime/src/hint-registry.ts`). There are seven families, set-equal to
   D1397's frozen list: mate in one, forced mate, double attack, fork survives reply, discovered
   execution, loose piece (`lost` only), and promotion pressure (persistent only). There are also
   five rungs, the executable `HINT_DECLARATION_MATRIX`, and the selection order.
2. **F1 graph** (`evidence-catalog.ts`, producer `derived.hint`). This has seven operator-only
   horizon projections `derived.hint.horizon.<family>@1`, each derived from its family source plus
   `live.stockfish.principal_variation@1` (declared_convention / measured / reported). It also has
   35 learner projections `derived.hint.disclosure.<family>.<rung>@1`, each derived from its
   horizon alone. The real manifest compiler rejects any widening.
3. **Horizon** (`selectHintHorizon`, `hint-distance.ts`). One bounded Stockfish principal variation
   is scanned to four plies. Only the root side's own ply 1 (`root_direct`) and ply 3
   (`root_followup_in_line`) are read, joined to the original sealed events and readings of the
   complete shared candidate packet for each of those positions. The horizon payload is computed by
   the value authority (`evidence-factories.ts`) from sealed inputs, so a literal, spread, JSON or
   rebuilt occurrence cannot be disclosed. Only horizons this process selected can be disclosed.
4. **Disclosure** (`compileHintDisclosure`). This produces a new frozen packet per rung. A lower
   packet physically lacks every higher field.
5. **Module** (`compileGuidedHintPacket`). Exactly one item is admitted through
   `module.guided_hint@1`, and one canonical sentence is rendered by a registered renderer.
6. **Receipt** (`compileHintDeliveryReceipt`). The only thing that crosses REST is a closed wire
   value with rung-discriminated marks and a digest. The browser (`parseHintDeliveryReceipt`)
   validates its shape and digest and renders only what the receipt carries.

The optional voice sees only the one-item rendered view. `hintVoiceCheck` rejects a square, piece or
move the rung does not carry, a different move, judgement and prescription words, and causality
words. If the voice is absent, times out, refuses or fails the check, the hint stays `available`
and the deterministic sentence is shown byte for byte (D1638).

## Protocol

- `POST /runs/:runId/hints` with body `{ nodeId, rung, decisionDigest, assistance }`, where
  `assistance` is the learner's stage-1 intent receipt. The server recomputes the decision stamp,
  context, access, boundary, ceiling and module activation. The client never sends a ceiling.
- `GET /runs/:runId/hints/:requestId` polls the operation. A moved decision answers `stale`.
- `DELETE /runs/:runId/hints/:requestId` cancels it. An unknown id returns 404, and the client
  sends the POST again.

Request ids are deterministic digests of decision, rung, manifest, compiler and search source, so
repeated POSTs join the same operation. `HintService` (`apps/server/src/hint-service.ts`) is
process-local and bounded. All rungs of one decision share one search, and every packet comes
from the injected application-lifetime `CandidatePopulationService`.

An open rated game is refused at the common enqueue boundary and on the hint path before any work
starts (`#refuseRatedAssistance`).

## Tests

- `packages/runtime/src/hint-distance.test.ts` covers registry equality, the D1397 drift
  tripwires, perspective and sign safety, D1640 forgeries, byte images, the F1 widening negatives,
  the voice check, receipts and ladder progression.
- `apps/server/src/hint-service.test.ts` covers the ladder, policy refusals, stale/cancel/404, the
  honest-empty case, source-unavailable, voice fallback, and the shared search and packet service,
  all through `createApplication`.
- `apps/web/src/lib/guided-hint.test.ts` covers the wire and the seat.
- The browser journey in `tests/browser/drill.spec.ts` runs Guide me → Hint → A little more
  up to the ceiling, then resets on commit.
