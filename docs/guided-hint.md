# Guided Hint

Guided Hint is the learner module for "I am stuck, show me the least that helps." It is implemented
from `rfc/hint-distance.md` (Checkpoint A, 2026-09-24). This page describes what exists in the tree.

## What a learner sees

Guide me and Support include `guided_hint`. When the server-compiled preset carries the module under
a ceiling other than `off`, the run's Support region shows a seat headed **Ask for the least that
helps**. It has one button: **Hint**. After the first answer the button reads **A little more**.
There is no rung or source picker in ordinary play.

The first **Hint** opens the card and makes one request. Guided Hint shares the other Support
modules' one-expanded-card state. Opening Theory or another module collapses it and removes its
board marks without resetting the current decision, cancelling an operation, or advancing the
ladder. **Open guided hint** restores an already revealed rung without another request. The card
stays mounted while collapsed; decision changes and teardown still own reset/cancellation.
Tablet shows the same controller inside the compact queue head, with a **Hint** selector below.
Resizing between tablet and desktop does not remount it, reset its rung or ask again.

The row counts the one delivered disclosure, not the number of rungs. Available answers show one
fact; explicit empty or unavailable-source answers show zero. An unasked/pending/failed/refused
request has no count. Identical snapshots preserve the answer; an actual decision-digest change
retires it. A held staged-move warning temporarily displaces the card without requesting again.

The seat never asks on its own. The learner has to press the button, and the request only runs when
the run's disclosure boundary is open, for example after **Show support for this position** in Just
Play. When the boundary is closed, the seat says so instead of showing a hint.

While a move, reveal, rewind or branch change is still being applied, or the new help configuration
is pending, Hint waits instead of sending the previous decision. The same guard covers the collapsed
selector and expanded action. Settling that work does not request a hint or advance its rung; an
already delivered rung remains until the decision itself changes.

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
The shared runtime assistance parser/migrator is implemented for the registered v4 head, with
TypeChecker-derived current-domain and browser-persistence controls. The browser no longer
carries its own assistance migration validator; v5/rung storage and the proposed owner table
remain distinct open obligations.
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

The shared horizon is keyed by the complete decision digest, including its branch and event
head, not merely by a node/FEN. A different decision cannot reuse a sealed occurrence from
the previous one. Pending engine discovery coalesces; failed discovery and unavailable horizons
are not retained as successful caches. Settled operation responses remain idempotent. **Try again**
explicitly deletes the failed operation before re-posting the unchanged decision and rung; a
restart's 404 is harmless, but a failed cancellation does not start a replacement. Nothing retries
autonomously or advances the rung on failure.

Each operation owns its cancellation lifetime. Cancel, stale, eviction and application shutdown
abort its private voice request through the actual health/provider boundary and detach promptly
even from a source that ignores abort. Cancelling one shared-search subscriber preserves its peers;
the final subscriber aborts the search. Late results cannot publish into a replacement operation
or update provider health. The optional voice keeps its two-second deadline and byte-identical
deterministic fallback; shutdown drains hint operations before closing provider health.

Retention pressure discards unused cached horizons before live subscribed searches. The client
polls at most once per 50 ms while pending. The pending window remains 70 seconds (formerly
200 × 350 ms), with both an elapsed-time deadline and a 1,400-poll cap. Network round trips count
toward that deadline; an already in-flight transport can still finish after it. The client then
shows a local “taking longer than expected” message, keeping the actual
operation identity for explicit retry, decision reset or teardown. Poll transport failures keep
that identity too. These local errors are not fabricated server responses or chess evidence;
retry cancels the known operation before re-posting the same decision and rung.

Every request first compiles all 35 exact Guided Hint bindings, including a request
that would reuse a retained horizon. Missing search is a required-source failure;
an available search with no selected occurrence is separately honest-empty. A bad
binding contract returns `failed/contract_violation` before engine identity, search,
packet or optional voice acquisition. It never weakens the learner's policy ceiling
or disables independent theory/structure modules.

An open rated game is refused at the common enqueue boundary and on the hint path before any work
starts (`#refuseRatedAssistance`).

## Tests

- `make guided-hint-client-check` covers the shipping cadence without the former 1 ms test
  override: ready results at six offsets render on the next 50 ms poll, the full 70-second
  pending window is preserved, slow round trips count toward it, and teardown during the wait
  cancels without a late poll/render. Fake-clock controls are not real-engine/browser latency.
- `make guided-hint-lifetime-check` covers exact-decision caches, discovery recovery, subscriber
  lifetimes, eviction, stale/cancel/shutdown, ignored aborts and mounted retry controls. Its real
  authenticated HTTP tests exercise application → health → external voice → outbound fetch,
  including the actual two-second deadline and late health isolation.
- `make guided-hint-execution-check` includes the complete family/rung source-policy
  contract and authenticated invalid-policy/latency/extra-binding controls, both cold
  and after a cached search, plus a successful request/poll shared-search control.
- `packages/runtime/src/hint-distance.test.ts` covers registry equality, the D1397 drift
  tripwires, perspective and sign safety, D1640 forgeries, byte images, the F1 widening negatives,
  the voice check, receipts and ladder progression.
- `apps/server/src/hint-service.test.ts` covers the ladder, policy refusals, stale/cancel/404, the
  exact closed honest-empty response, source-unavailable, voice fallback, and the shared search and packet service,
  all through `createApplication`.
- `apps/web/src/lib/guided-hint.test.ts` covers the wire and the seat.
  Readiness controls cover both collapsed/expanded actions, zero autonomous requests and retained
  rung progression when the same decision temporarily waits.
- `make play-composition-client-check` runs the mounted hint and run-screen contracts.
- The real state-6 browser journey covers the final permitted rung, shared expansion, retained
  progress, request counts and actual board marks at all seven composition projections. It runs
  in `make test-browser-ci`; `make play-composition-hint-check` selects just that regression.
  It also holds genuine reveal/help HTTP responses at both readiness boundaries, hit-tests native
  clicks on disabled controls and verifies every subsequent POST uses the committed decision.
- `make guided-hint-browser-latency` separately captures twenty real-Stockfish/Chromium
  samples per frozen cell; `make guided-hint-browser-receipt-check` replays saved identities,
  visible post-frame output and source-off controls. Pure falsifiers/type checks run in
  ordinary software CI; machine-specific timing does not. The 2026-10-06 repeat puts all
  non-timeout rendered cells below 150 ms p95, but optional voice still waits ~2 seconds.
  Fifth-rung policy refusal and owner-device/use remain open; this is not full Hint D7.
- The browser journey in `tests/browser/drill.spec.ts` runs Guide me → Hint → A little more
  up to the ceiling, then resets on commit. A separate transport-failure journey proves explicit
  DELETE → unchanged POST retry and subsequent ladder continuation against the real server.

The empty-response controls treat request IDs as opaque identifiers, even when their hex
digits resemble a move. Extra move, sentence, PV or delivery fields remain refused by the
closed response parser; a substring scan of the ID is not a disclosure test.
