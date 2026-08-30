# Opponent experience — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/opponent-experience.md` against current `play-composition`, bot policy and roster
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make opponent-experience-fresh-review` — 5/5 blocker arms
- **Production status:** untouched; no picker/card/bar implementation is authorized

The indivisible picker + grounded card + visible identity outcome is the right boundary. Exact
profile identity, no silent provider substitution, roving keyboard selection and strong-engine wall
separation also survive. Five seams still allow the implementation to recreate the current squeezed
board/raw-string experience or make historical games unreadable.

## B1 — both foundation dependencies are returned ([[D2238]])

The RFC requires accepted bot policy and roster contracts. Both are now returned: D2219–D2226 and
D2233–D2237. Catalogue identity, provider state, public operation result, calibration identity and
behavior breadth are all inputs to this surface and are not stable.

**Required repair:** hold this RFC returned until both dependencies survive review, then regenerate
the catalogue/card/state types from their final shared authorities.

## B2 — the identity bar violates the accepted board composition ([[D2239]])

This RFC puts a new fixed-height bar immediately above the board and says it remains there on phone.
Accepted/implementing `play-composition` is explicit: “nothing above the board” at every viewport,
the board stage has only the board and strip, and all other content uses shell chrome or the
companion region. The phone contradiction is doubled: opponent details promise never to cover the
board while the accepted phone companion is a bottom-sheet overlay over its lower edge.

**Required repair:** assign opponent identity to one existing fixed shell/topbar slot or amend the
composition contract through its owner. The card/details use the existing companion seat protocol;
they do not invent a second sheet. One shared 7×16 post-gesture matrix must test both RFCs, including
long name, degraded state, card open and keyboard focus.

## B3 — a missing historical declaration cannot render the promised identity ([[D2240]])

Resume stores only `{id, version, digest}`. When that exact declaration disappears, the RFC promises
the run remains readable and “names the unavailable stored identity,” while ordinary Play must show
zero raw ids. No name, avatar, card snapshot or immutable catalogue history is declared in the run.
The server therefore has no bytes from which to render the promised person.

**Required repair:** choose and specify one historical identity authority: immutable catalog entries,
a persisted presentation receipt/snapshot, or a durable profile-history table with deletion/export
posture. Cross profile withdrawal, asset update, server upgrade and account export. Do not fall back
from digest to current name.

## B4 — availability and degradation are raw strings, not a UI protocol ([[D2241]])

`OpponentCard` exposes `available:boolean` plus `unavailableReason:string|null`; the bar asks for a
“typed degraded reason” but no type, severity, retryability, action or copy mapping exists. The
failure table adds catalogue/provider/guard/digest/stale/recommendation/route cases without joining
them to a closed result union. Internal provider errors can therefore become learner strings, and
two surfaces can treat the same state differently.

**Required repair:** consume the final provider-health and opponent-operation result authorities
through one closed presentation-state union. Each state owns availability, stable code, safe copy,
retry action and whether existing play can continue. Raw provider/error strings never render.

## B5 — “analytics receipts” have no storage or privacy contract ([[D2242]])

Section 8 says the experience records eight operation classes plus exact profile digest, while the
RFC claims no schema/migration/shared vocabulary and names no sink, retention, export, deletion,
consent or self-hosted default. “Operational receipt” does not decide whether these are ephemeral
logs, durable learner events or external telemetry.

**Required repair:** either remove analytics from the acceptance surface, define local ephemeral
structured logging with no learner identity, or depend on a separately accepted telemetry/receipt
contract. No external collection is inferred by implementation convenience.

## 1.0 program gap — the explicitly excluded bot experiences need homes ([[D2243]])

Bot tournaments, per-bot relationship/history pages and observed bot traits are out of this bounded
surface, which is reasonable. They are not actually assigned to RFCs or research questions here,
despite the sentence saying every exclusion has a named downstream lane. The owner explicitly asked
for bot tournaments and relationship/personality depth. They must remain visible in the 1.0 program
instead of disappearing when this picker ships.

## Owner decisions still real

Final names/art ([[D1610]]) and first-run default ([[D1611]]) remain owner inputs. They do not block
this return's mechanical repairs, and the roster's policy/display digest split should be settled
before either is encoded.

No server, schema, route, client, CSS, asset, analytics, content, archive or protected-design byte
is authorized by this return.
