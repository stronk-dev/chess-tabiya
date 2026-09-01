# Held promotion collectors — third author repair

- **Date:** 2026-09-01
- **Scope:** [[D2469]]–[[D2472]] only; the twelve implemented Wave-C projections are unchanged
- **Positive contract:** `make semantic-collectors-promotion-third-author-repair`
- **Disposition:** author repair complete; fourth fresh independent review required before the held
  pair can be accepted, and provider/value-authority dependencies still gate implementation

## Repair

1. **Domain before success-only legal moves.** The tablebase request no longer carries a legal map.
   A provider local-domain result or source failure returns before the injected exact legal-map
   resolver is called. Recorded/live success alone can demand that input.
2. **One source-selection operation.** `PromotionRaceTablebaseRequest`, its dependency interface and
   `collectPromotionRaceTablebase` are explicit. A sealed resolver queries the authoritative
   recorded-evidence index; recorded wins fixed precedence, and only sealed absence permits live
   execution. Callers cannot name a source preference.
3. **Invariant failure stays failure.** Every evidence-bearing arm invokes its specialized central
   assertion. Forged, wrong-FEN, wrong-factory or value-mutated evidence throws
   `EvidenceInvariantError`; it cannot be turned into `input_abstained`, recorded absence or a live
   fallback. Only a typed upstream-unavailable arm abstains.
4. **No witness is completed truth.** Valid contacts with no opposing passed clear paths return
   `completed/no_evidence/no_opposing_passed_clear_paths`. The outcome operation passes that state
   through without reading recorded storage, legal moves or Syzygy.

The disposable model makes source preference and eager legal maps unrepresentable on the request,
requires the sealed recorded-resolution brand, and refuses an unavailable no-race value. Four
prose assertions bind those types to the RFC operation order. This is an author/buildability model,
not product evidence or implementation.

## Still held

- A fourth fresh reviewer must attack the repaired boundary independently.
- `evidence-value-authority` must land the exact contacts/legal/recorded/derived factory receipts.
- `provider-exchange-and-execution` must land the shared receipt-bearing Syzygy operation and
  projection-effective execution metadata.
- No runtime, schema, content, module, preset, bot or learner surface changes in this checkpoint.
