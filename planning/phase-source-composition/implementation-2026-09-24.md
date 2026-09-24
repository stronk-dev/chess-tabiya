# Implementation receipt: `rfc/phase-source-composition.md`

**Date:** 2026-09-24 · **By:** claude, at the owner's direction (no review rounds). Status token left
`draft` for status-parity; the coordinator flips the README row and body together.

## What shipped

- `apps/server/src/phase-source-composition.ts`: `compilePhaseSourcePoint` / `compilePhaseArc`
  (WeakSet brands, `assertPhaseSourcePoint` / `assertPhaseArc`), `resolveOpeningSources` (one
  `openingIdentityAt` call bound to the retained `run.record.position@1`), `compileRecordedEvidenceSnapshot`
  / `resolveRecordedTablebase`, the live Syzygy slot (request-digest-bound), the forbidden-root-key
  guard, source-local changes, and the eight `PHASE_SOURCE_*` failures.
- Runtime operations `phaseReadingEvidence(fen)` and `invokeRunRecordPosition(run, nodeId)`;
  `positionGuidanceEvidence` accepts the point's items instead of re-minting them.
- `PackRecord.recordedEvidence` (verified with ledger digest / unverified / invalid).
- **Support handoff:** `guidance.ts#evidencePacket` compiles the point; its rules phase, endgame and
  declared phase/endgame items come from the point (the three REST call sites pass
  `phaseSourcesFor(access.pack)`). The packet's pre-existing `phase` field (pack-authored label when a
  pack exists) is unchanged wire shape — a residual owned by `evidence-presentation`/module work.
- **Review handoff:** `service.review` compiles the arc over the exact selected branch; the Review
  evidence panel consumes the arc's retained recorded path (the arc calls the sole recorded-path
  operation). The arc is never serialized.
- Consumer pairs: none — the views are server-private, not F1 projections.

## Criteria → tests (`apps/server/src/phase-source-composition.test.ts`, 11 tests)

**1–4 open** (the 804/100-path census through production symbols was not rerun) · 5 "retains two
exact opening abstentions…" · 6 "refuses a position that is not…", crossed provider FEN · 7
"keeps no pack, unverified, invalid, recorded and absent…", "retains the provider's source-failure and
local-domain arms…" · 8/9/10 "retains the five-arm decision, classifies endgames only…" · 11 "keeps
opening, rules phase and endgame as independent slots…" · 12 "refuses structural clones…" · 13
"Support and Review invoke the compiled operation…" · 14 Support receives one point, Review one arc
(bot/longitudinal: D4/D5 open) · 15 no renderer, rank, preset or prompt changed · 16 "keeps the view
server-private…" · 18 `docs/evidence-contract.md` §Phase sources · 19 D2485 flip left to the
coordinator; D2487 stays open · 20 fresh review not run (owner directive).
