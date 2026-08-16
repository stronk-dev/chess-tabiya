# Recorded evidence at runtime

Tabiya retains admissible authoring-time engine and tablebase readings when it loads a
digest-current pack ledger. The projection is position-keyed, derived in memory, and never
persisted in the run. It adds no engine, tablebase, explorer, or network request during play.

## Admission

Only `engine_eval` and `tablebase_result` records grounded by machine validation are admitted.
The ledger must validate, carry the current pack digest, and already qualify as
`ledger_verified`. Engine readings must be single-line, White-perspective results with a
complete engine identity. Tablebase readings must use a determinate category. Template-backed
move verdicts and the other five evidence kinds are refused by a complete disposition
registry published through `/capabilities`.

The index copies an explicit value allow-list rather than retaining the ledger's open value
bag. Multiple readings at the same transposition key remain distinct. A tablebase reading is
served only when its recorded halfmove clock equals the run node's; a live same-kind
`evidence.attached` event suppresses the older authored reading.

`PackRecord.positionEvidence` is server-local. It is absent from pack documents, summaries,
exports, distilled packs, and every other wire projection.

## Disclosure and rendering

Recorded readings use the existing run-level guidance disclosure decision. A closed delivery
window, participant, or spectator cannot cause a reading to enter any evidence packet or
external-provider request.

An admitted reading is a past-tense, attributed measurement at exactly one node. Engine prose
names identity, depth, the single-line bound, White perspective, value, and authoring date.
Tablebase prose names Syzygy, piece count, category, any published DTZ/DTM values, White
perspective, and authoring date. It names no move or square and computes no cross-node delta,
rank, or verdict. Absence produces no per-position sentence.

The structured reading never enters `EvidencePacket.sentences`. Voice and reasoning providers
receive the same closed sentence list as before; after provider rendering, the server appends
the frozen reading prose. This prevents a provider from paraphrasing the measurement or
inventing a claim about missing coverage. A client surface that displays a reading also shows
the single population guard:

> Recorded readings exist only for the positions this pack's author queried. Where none is
> shown, none was recorded.

## Current measured corpus

The development registry currently loads 57 documents. Thirty-two digest-current pack
ledgers contribute 732 admitted readings (391 Stockfish evaluations and 341 Syzygy results)
across 731 per-pack index entries and 568 corpus-distinct positions. The same ledgers contain
32 legality records, which remain refused.

Across the 497 authored spine positions in those packs, one-ply enumeration produces 11,559
legal moves and 11,464 per-pack-distinct successor positions. Only 699 successor positions
already have an authored reading; 10,765 (93.90%) do not. Of 372 one-ply arrivals at a key
with tablebase data, 43 are correctly refused because the halfmove clock differs. These are
coverage measurements, not product grades.
