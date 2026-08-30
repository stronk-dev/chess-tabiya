# Recorded clocks — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/recorded-clocks.md`, the current import/storage/run/API paths, the returned
  `live-sources` contract and both committed clock corpora
- **Verdict:** **RETURN TO AUTHOR**
- **Reproduction:** `make recorded-clocks-fresh-review` — 11/11 checks green, covering ten
  contract findings plus a fresh corpus measurement
- **Production status:** `clockState` remains an opaque zero-reader object; no clock parser,
  persisted reading, projection, API field or learner readout ships

The depicted-clock direction survives. A clock annotation is a recorded fact, and showing it at
the move it belongs to remains law-8 clean. The draft is not buildable because it loses that move
identity at its first type boundary, never specifies how the persisted data reaches a node or a
client, and promotes arbitrary client timestamps to learner thinking time.

## B1 — the required predecessor is returned ([[D2286]])

The RFC calls `live-sources` accepted and positions its migration behind it. Acceptance was
withdrawn on [[D2277]]–[[D2285]]; its clock extractor is not production code and its per-game
clock contract is itself returned on [[D2281]]. `bot-policy`, the preceding run-schema claimant,
is also returned.

Refresh the dependency table and make implementation conditional on accepted predecessor bytes.
The valid corpus evidence can survive without pretending the handoff exists.

## B2 — `ClockReading` drops the identity supplied by the source ([[D2287]])

The proposed live-source handoff is `{ ply, remaining }[]`. `ClockReading` contains only
`remainingMs`, `side` and `source`, and `imported_games.clocks` is an array of that smaller type.
Array position cannot replace `ply`: annotations can be absent, malformed or duplicated, and a
missing middle reading shifts every later array index onto the wrong move.

Persist an exact per-game move key—at minimum `ply`, preferably the selected game/snapshot
identity too—and reject duplicate readings for one ply. Derive `side` from the authoritative move
when possible instead of trusting a second copied operand.

## B3 — storage never reaches the run or the learner ([[D2288]])

The RFC adds columns and narrows `Node.clockState`, but names no operation that parses a stored PGN,
joins a reading to the matching imported node, writes or projects it, exposes it over REST, parses
it in the client, or occupies a rendered seat. Current `RunService`, storage and web types have no
clock reader. A migration plus an interface can satisfy most criteria while rendering nothing.

Specify one complete path with exact symbols and ownership:

`stored PGN/source extraction → validated per-ply readings → imported node projection → typed API
view → fixed-size clock module`.

Cross missing/duplicate/malformed readings and a branch created after import; an imported clock
must never attach to a learner-created alternative at the same numerical ply.

## B4 — the time-control string has no domain contract ([[D2289]])

The RFC declares canonical `initial+increment` serialization but defines no parser, closed parsed
type, numeric bounds or result for absent, invalid and unsupported headers. `parsePgnMainline`
retains arbitrary header strings. The two committed populations only establish that the paste
sample uses the simple form and the broadcast sample carries no header; they do not make every
future header simple.

Add one shared parser returning a closed `supported | absent | invalid | unsupported` result, with
bounded integer operands and round-trip fixtures. The enforced-clock successor must consume the
same parsed authority rather than parse the string again.

## B5 — `createdAt` delta is not learner thinking time ([[D2290]])

`timestamp(at)` accepts any client string without validation or ordering. Import commits every ply
with one timestamp. Ordinary event gaps can include a backgrounded tab, network delay, provider
work, UI reading and other lifecycle time. The draft acknowledges only client authority and the
imported-zero case, then licenses the much stronger sentence “You spent 8 seconds here.”

Either remove the measured arm from this RFC or define a server-observed decision window with
start/stop/pause semantics, monotonicity, maximum inactivity and an honest label such as “elapsed
while this decision was open.” An informational label does not make a false measurement true.

## B6 — retroactivity has states but no transition ([[D2291]])

`null = not parsed` and `[] = parsed, none` are useful states. Nothing says who changes one to the
other, whether migration backfills or reads lazily, how retries are idempotent, how a partial
failure is represented, or how the run snapshot and import record remain consistent. Criterion 12
requires old rows to produce readings without re-import while specifying no executable route that
can make that happen.

Choose one transactionally defined backfill/lazy operation, give it an idempotency key and terminal
failure state, and fixture interruption plus retry. Do not expose “not yet parsed” as if it were a
chess-data absence.

## B7 — criterion 9 is not a hermetic acceptance gate ([[D2292]])

It reads the deployment's private mutable `imported_games` table and intentionally fails if every
row has clocks. A clean install has zero rows; a legitimate corpus can have complete coverage; CI
cannot reproduce either the count or the privacy boundary. Negative fixtures already exist to
exercise abstention.

Keep deployment prevalence as an optional operator measurement with a dated receipt. Make RFC
acceptance depend on committed positive, absent, malformed and sparse fixtures, never on what users
happen to have imported.

## B8 — legacy quarantine is outside the declared type ([[D2293]])

The RFC narrows `Node.clockState` to `ClockReading` while requiring arbitrary legacy objects to
survive byte-identically and replay. Current replay trusts stored event bytes; TypeScript will then
claim junk is a `ClockReading`. “Every reader ignores it” has no parser or branded boundary that
makes the claim true.

Define the raw legacy storage shape separately from the validated projection, parse at one boundary,
and ensure only the validated result reaches renderers or enforced clocks. Fixture literal, spread,
JSON and old-event junk, not just one friendly object.

## B9 — the broadcast coverage claim and criterion use the wrong grain ([[D2294]])

Fresh measurement reproduces **902 annotations across 10 finished-round games, but only 9 of 10
games carry any clock annotation**. The RFC's “broadcast path carries clocks” headline and
“readings present” fixture therefore overstate its own evidence. Criterion 6 cites all 902 readings
for one selected-game behavior, even though production selects one game before sanitization.

Retain 902 as a round census only. Publish per-game counts, fixture the zero-reading finished game,
and evaluate abstention after selection. This is the same wrong-grain family [[D2281]] found in the
predecessor, now shown to change the verdict rather than merely weaken the test.

## B10 — the migration claim omits one of its durable columns ([[D2295]])

The normative record adds both `clocks` and `timeControl`; the registered migration claim names only
`imported_games.clocks`. That lets an implementer persist the control under an undeclared column,
leave it derived from mutable headers, or omit it while the register remains green.

Declare the exact SQL image for every new column, CHECK/null state and account export/delete/restore
projection. If `timeControl` remains derived from immutable stored PGN, say so and remove the column
from the normative interface.

## Repair order

1. Repair and re-accept the live-source per-game extraction contract.
2. Define exact clock/time-control identities and legacy parsing.
3. Specify the full ingestion→node→API→module path and retroactive transition.
4. Remove or rebuild the false learner-spend arm.
5. Replace deployment-data acceptance with committed able-to-fail fixtures, then repeat review.

No implementation is authorized by this return.
