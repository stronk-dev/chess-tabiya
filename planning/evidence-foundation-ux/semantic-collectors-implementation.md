# Semantic collectors implementation plan

**RFC:** `rfc/semantic-collectors.md`  
**State:** accepted; queued behind complete Tactical and Breadth landings  
**Scope:** 14 basic semantic tactic/race projection ids; no learner copy, module ranking, preset,
schema, content, player-style verdict or bot-policy weight.

## Entry conditions

1. Tactical has landed all 30 ids, including the independently reviewed D829–D835/D931 repair.
2. Breadth has landed all 18 ids and its recorded-path sequence compiler.
3. The D931 promotion binding reads typed unavailability as unavailable, never refuted.

At 2026-08-22 HEAD all 14 Appendix-A ids are absent from the compiled catalogue. The accepted RFC
contains no remaining owner question for this registered set.

## Execution slices

### S1 — defender duties and one-edge facts

- Add the total defender-duty state: defender/target identities, roles, and co-defenders.
- Join the existing capture identity to emit exact defender removal; do not detect capture again.
- Emit defender relocation only when the same defender loses a named surviving duty.
- Keep all three facts literal. Multiple duties are not overload; relocation is not deflection or
  attraction.

Permanent boundaries: pinned defender, multiple co-defenders, captured defender with surviving
target, relocated defender with retained/lost duty, replacement identity, color/file mirrors.

### S2 — observed manipulation and line tactics

Compile identity-retaining recorded windows over the Breadth sequence authority:

- `deflection_observed@1`: bait, exact defender displacement, lost duty, later positive capture of
  the exact target;
- `attraction_observed@1`: K/Q/R captures the bait onto the arrival square, followed by the exact
  check/capture consequence at its declared horizon;
- `line_blocker_clearance_observed@1`: source blocker vacates and the unchanged slider later gains
  the exact ray/capture;
- `square_clearance_observed@1`: destination square is vacated and then occupied by the declared
  beneficiary under the recorded-run-only contract;
- `interference_observed@1`: a destination enters and interrupts the exact opposing ray;
- `check_zwischenzug_observed@1`: the inserted checking move occurs before the deferred recapture
  sequence.

Every window rejects changed anchors/FENs, replacement pieces, wrong square, wrong horizon and
missing consequence. Recorded order is not intent, force or quality.

### S3 — overload and bounded mate proof

- Compile overload response conflict only from a sole defender with multiple retained duties,
  legal recaptures, duty loss on every recapture, and a positive capture remaining afterward.
- Compile observed exploitation only for the exact capture→defender recapture→different-target
  positive capture window. Do not call the recapture forced.
- Add the deterministic mate-proof module for one declared candidate, 1–4 attacker moves,
  existential attacker moves, every defender reply, all promotions, fixed move ordering and the
  250,000-node contract.
- Return `proved`, `refuted` with a witness, or `budget_exhausted`; never convert exhaustion to
  false or infer a mating net from king-zone/escape/check geometry.

The semantic feature is basic; the bounded proof is the evidence required to name it without
guessing. Five-plus attacker moves remain a separately versioned authority.

### S4 — promotion-race description and exact outcome join

- Keep Tactical's one-sided per-pawn promotion-pressure projection; do not re-register it as a
  complete two-runner population. Derive the race from the sealed complete pawn-contact reading,
  retaining only exact opposing passed pawns with clear forward paths.
- Derive descriptive alternating-turn arrival order only under the pinned race convention. The
  permanent a2/b7 adjacent-file false positive must refuse; a2/h7 retains arrival plies 9/10.
- Join Syzygy/tablebase result by byte-equal canonical full FEN. Both literal alternatives also
  retain the exact legal-move map because immediate-promotion/check operands are not in geometry.
- The live arm waits on shared `live.syzygy.position_result@1`; the recorded arm uses
  `recorded.tablebase.result@1`. Do not create a pawn-specific source adapter.
- Compile effective availability/latency per derivation member; `derived.pawn` contains both local
  and optional-provider outputs and cannot truthfully have one effective scalar for every output.
- Keep geometry and outcome as separate items; only the tablebase input may supply outcome words.

Permanent boundaries: blocked/capturable path abstention, geometric-order inversion against
Syzygy, outside-domain tablebase, and typed promotion-input abstention.

Contract closure: `design/research/promotion-race-contract-closure.md` and
`promotion-race-author-repair-2026-08-26.md` ([[D963]], [[D1699]], [[D1700]]). Author amendment and
repeat review precede the held implementation.

### S5 — catalogue, fixtures, measurements, and closeout

- Register all 14 ids on existing producers with the exact roles/operands/grounding/abstentions.
- Add brand-sealed adapters and required exports within the seven-site production census.
- Move disposable positive/hard-negative fixtures into permanent runtime tests without editing the
  concurrent research copies.
- Reproduce authored/imported/Lichess censuses as declared; retain authored zeroes as content debt.
- Keep all production module/workflow/preset/renderer bindings at zero.
- Update the two evidence docs, flip shipped ledger rows, append the exploration log and archive in
  the landing commit.

## Gates

1. Appendix A and compiled catalogue are set-equal at 14/14.
2. Every event retains exact operands and observed-window continuity.
3. The broad-overload, any-piece attraction, relocation-without-consequence, adjacent-depth mate,
   and geometric-race-verdict controls remain hard negatives.
4. No duplicate capture, check, reply, exchange, passed-pawn, tablebase or recorded-move authority.
5. Derived declarations inherit the weakest grounding/exactness and all input abstentions.
6. No pre-commit move, line or evaluation leak.
7. Mate proof is deterministic at its cap and exposes no false result for exhaustion.
8. Measurements retain population zeroes and any named domain corrections.
9. Focused runtime, manifest, semantic, measurement, parity and register checks pass.

## Handoff to product behavior

Only after these 14 ids compile should learner modules, bots, Review, drills and presets bind them.
Those consumers decide significance and disclosure:

- Support can name an observed relation or give a non-move nudge;
- Review can join engine/human/theory evidence and grade separately;
- bots may consume exact features as policy inputs without sharing guidance prose;
- longitudinal analysis may aggregate versioned opportunities/events without inventing a player
  type from raw counts;
- pack authors receive vocabulary only through a later versioned schema RFC.

This is the foundation boundary the UX needs: exact semantic items in, bounded module output out;
never a raw evidence dump and never an LLM asked to discover the chess fact.
