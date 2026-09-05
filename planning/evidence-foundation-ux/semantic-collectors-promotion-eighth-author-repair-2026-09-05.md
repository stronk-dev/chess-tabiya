# Held promotion collectors — eighth author repair

- **Date:** 2026-09-05
- **Repairs:** [[D2693]], [[D2694]], [[D2695]], [[D2696]], [[D2697]], [[D2698]], [[D2699]], [[D2700]]
- **Gate:** `make semantic-collectors-promotion-eighth-author-repair`
- **Scope:** disposable RFC-tier model only; no production collector is authorized

## Repair

One asynchronous `collectPromotionRaceTablebase` operation now owns the whole transaction. It
asserts the sealed geometry result before branching, returns no-race without touching a source,
consults the authoritative recorded lookup first, invokes the provider only on recorded absence,
and resolves exact legal moves only after a recorded or live success. Recorded success never calls
the provider; provider failure/domain/cancellation never calls the legal resolver. A maintained call
trace proves each ordering, including the zero-call no-race path ([[D2693]]).

The disposable scheduler is the sole request-digest authority. Its SHA-256 identity covers the
literal operation/provider/request image and yields exactly 64 lowercase hex digits; changing the
same FEN's timeout changes the digest. `collect` computes the expected digest before `get`, and its
private invocation constructor rejects any returned-arm mismatch before inspecting success,
outside-domain or failure semantics ([[D2694]]–[[D2696]]). Scheduler, lookup, legal resolver and
source-factory dependencies are runtime-sealed, so a spread structural substitute cannot enter the
transaction. Cancellation is carried to the scheduler and returns the exact `cancelled` provider
reason without legal-map work.

Recorded truth now has two explicit authorities. A canonical full-FEN, canonical UTC timestamp,
source id and parser/legal-move-validated tablebase position first become sealed
`sourcing.ledger.tablebase_result@1` evidence. Only that exact object can become
`recorded.tablebase.result@1`; the value receipt retains its source object and digest. A generic,
spread or caller-JSON tablebase reading fails ([[D2697]]).

The provider scheduler parses all live position/move values and validates every returned UCI
against the exact request FEN before sealing delivery. An impossible move becomes
`invalid_response`, not tablebase truth, and legal-map resolution remains untouched ([[D2698]]).
Outside-domain additionally reproduces exact piece count from the request and carries one declared
`rules.endgame.tablebase_domain@1` item retaining the whole provider result.

Contact absence has one sealed constructor and flows through the total geometry operation into a
sealed `input_abstained/missing:[geometry]` result with zero dependency calls; spread/unsealed
lookalikes fail ([[D2699]]). Live evidence can be minted only by the runtime-sealed
`sourceFactories["syzygy.position@1"].make` operation after it asserts the exact provider delivery;
the pawn collector contains no generic live-evidence adapter ([[D2700]]).

## Evidence and hold

The maintained target retains every prior promotion author/review gate, passes 8/8 new behavioral
groups and strict TypeScript. During authoring, an initial deep-copy aggregate broke private
DeclaredEvidence/provider seals; the repaired model instead preserves each independently sealed
child by reference and freezes the aggregate, matching the RFC's identity rule. A first
outside-domain fixture also blocked one pawn's path and correctly returned no-race; it was replaced
with an eight-piece position whose two pawn paths remain clear, while the scheduler now independently
reproduces the piece count.

This is author evidence, not acceptance. Both promotion projections remain held at 12/14 until a
ninth genuinely fresh independent review passes and the provider/value dependencies land.
