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

## 2026-11-04 — Concrete author repair prepared for separate independent review

The historical return above is retained. The active rfc/recorded-clocks.md now contains a
concrete author repair; this entry does not accept it or report tests as passed.

Current source trace corrects the old raw-PGN assumption: resolveImportSource strips paste and
remote PGN before RunService writes ImportedGameRecord.pgn. stripNodeAnnotations replaces each
move's data with {san}; remote export also requests clocks=false. D2021 already requires the
request/extract-before-strip/typed persistence/account-lifecycle/real-fixture unit. The repair
therefore retains one exact nullable clock_document_json column, not a read-only reparse design
that cannot recover discarded bytes. Declared control is parsed from already-retained headers;
there is no second timeControl column.

The repaired contract specifies a closed selected-game/source-ply/sample document, original
import-node mapping, atomic new import and idempotent legacy null→parsed transition. Unknown
historical retention remains unknown; valid retained samples may project, but missing stripped
samples are never reconstructed or called original no-clock evidence. Account export, restore
validation/id mapping and delete are part of the declared durable image.

It names the authorized source operation, actual original-prefix/node joins, private source
factory, REST/strict receiver and bounded historical readout. One explicit clock_reading@1 frame
owns sample/control/absence wording independently of foundation clock_decision availability.
It is an additional clock-dependency source, not an unregistered extra foundation row. No raw
sentence or caller-authored clock/control/actor list may mint evidence. Both source/renderer
tuples must actually exist before learner delivery is claimed.

D1041 still requires simulated pressure, real play clocks, bot move-time models and rating
consequences. Recorded clock-use arithmetic is allowed only for complete adjacent same-player
samples/control. The learner's own live measurement remains an explicit server-clock authority
discharge; client Node.createdAt is not substituted for it. D361 is not falsely closed, and
the enforced-clock successor must refresh its old ClockReading/source and run-lane assumptions
against this repaired contract before implementation. Its existing D2296–D2307 review still
owns the real-clock problems. Existing protected-intent amendments remain owner-tier work.

The source RFC's unnecessary run0.20 claim was released; no other run claimant was renumbered.
Its one migration claim and rfc/README.md row now name the complete numeric document/account
image. The migration's existing behind-live-sources scheduling label is not a claim of accepted
or installed broadcast behavior; ordinary pre-launch order remains engineering-owned.

Every original D2286–D2295 return and D2021 has an explicit trace row/control in the repaired
RFC. Historical902 is still only a round census and nine-of-ten selected-game coverage stays
visible. Correctness now requires hermetic sparse/duplicate/malformed/control/branch/access/
SQLite/REST/strict-client/UI/account/transaction fixtures, not mutable private production data.
No implementation or tests/builds were run by this authoring pass. Separate independent review
must decide buildability and scope before code begins.

## 2026-11-04 — independent acceptance of the separately authored recorded-source repair

**Verdict: accepted for the bounded recorded-clock source implementation described by the
repaired RFC.** The August return and its reproduction result above remain historical. This
review is a fresh static buildability/source/intent review, not a rerun of that harness and not
acceptance of a clock implementation, the returned enforced-clocks contract or whole D1041.
Reviewer authored none of the repaired RFC and made no implementation/contract amendments.

The reviewer read the complete repaired rfc/recorded-clocks.md, D2021 and D2286–D2295,
the D1041/D330/D361/D364 intent trace and current import, parser, service, SQLite, account,
recorded-path/boundary and presentation/client machinery. No genuine buildability blocker
remains in this repair. The following source observations substantiate that bounded verdict.

### Actual ingestion and durable image

apps/server/src/import-source.ts currently strips both pasted and fetched PGN before returning
ResolvedImportSource; stripNodeAnnotations replaces each move's data with {san}, and the game
export URL requests clocks=false. RunService.importGame stores that already-sanitized source.pgn.
The repair correctly treats request, extraction before this transformation, typed persistence,
account lifecycle and a real resolver-to-storage fixture as one D2021 unit. Stored PGN is not
presumed to retain historical clock comments. The existing parsePgnMainline in
apps/server/src/pgn-import.ts supplies a real shared validation seam: exactly one game,
no variations, Standard/From Position root validation, fully legal mainline and300-ply bound.
Its current return omits comments, so the new parser must walk the selected original game
before stripping while sharing that validation; reparsing its sanitized output cannot fulfill
extraction. The RFC's64KiB source bound applies before this new parse/extraction work.

SQLiteRunStorage.createImportedRun already transactions the run/grant/import record together.
The repair's one nullable clock_document_json column extends this real owner instead of
inventing a second clock/run authority. Complete sourcePly/side/UCI samples and root-plus-all-
original-node mapping preserve sparse identity. Declared control derives from existing
ImportedGameRecord.headers.TimeControl, with no unclaimed control column. New empty extraction,
legacy unknown retention, unexamined null, terminal unavailable and transient source failure
are distinct; null-CAS/reload and transactional restore give the promised retroactivity an actor
and retry boundary. No historical re-fetch or lost-comment reconstruction is licensed.

Account exported ImportedGameExport, strict validateOwnedRuns, restoredImportedGame and the
storage export/restore SQL are actual required extension points. They currently have closed
field lists and explicit columns; the implementing change must add/validate the document to
all of them and retain the existing prose-strip boundary. The RFC now expressly owns that
complete image, source/node validation, rollback, id mapping or refusal, and deletion. This
acceptance does not pretend those edits already exist or close D2021/D2295 on a schema alone.

### Original source, clock arithmetic and absence

The proposed recordedClockOperation has a real storage/access host: requireRead in
authorization.ts and RunStorage's own run/import readers. Existing recorded-review-boundary.ts
already validates complete event replay, exact unique creation-event identities, legal original
paths and imported-mainline movetext digest before endpoint narrowing; recorded-semantic-path
is an existing recorded-edge authority, not a clock owner. These mechanisms make the specified
private original-import clock owner buildable. The new owner must retain its own captured
document/access/head membership; caller callbacks, copied documents, generic seals, same-ply
or same-FEN retry nodes cannot become that owner. New original import mapping is captured
before learner branching; legacy mapping must prove the actual immutable import prefix or
return its explicit terminal unavailable state. Shared original ancestors remain distinct
from later lookalike nodes.

The first-decision attack does not require a new product ruling. Repaired §5 explicitly allows
base fallback only for an established standard initial-game first decision, and refuses a
truncated or unproven start. A first stored node, sourcePly1, a FEN fullmove counter or an equal
starting-board position alone is not that proof; Setup/FEN/custom/truncated and unproven imports
must abstain unless the specified genuine start basis is established. Acceptance2 and9 require
setup/root and initial-base eligibility controls. Previous means the immediately preceding
original same-side decision; a missing intervening tag cannot be skipped to a nearest earlier
sample. The post-move increment allowance is explicit, with safe exact arithmetic, prior-source
identity and missing/nonpositive/overflow/current-greater-than-available abstention. Staged,
delayed and other unsupported controls cannot borrow simple Fischer arithmetic; remaining
clock may still be shown with typed control absence. No thought-time inference follows.

clock_reading@1 is explicitly one additional dependency-owned source_record frame, with sample
and ParsedTimeControl status even when remaining/spend data is absent. It is not an extra row
silently inserted into foundation's23-source/five-predicate scope. Foundation clock_decision@1
remains a separate exact recorded actor/decision/event/phase source with genuine spend operands
or typed unavailable. Imported actor context cannot become learner context merely through
selected side. No generic constructor or unavailable-only factory counts as either source.

### Delivery and preserved intent

The repair now names a complete RunService.recordedClock → authenticated read-only REST →
strict DrillApi → bounded ClockReadout path and exact review.recorded_clock@1 consumer plus
two registered renderer bindings. These fit existing exact consumer execution/presentation
registries and strict client seams, while requiring actual source/operation/renderer installation
before learner delivery is claimed. Successful truthful absence belongs to the complete source
frame; missing/broken source authority produces no successful evidence item. Source/subject/
receipt/arithmetic crossing, help/access changes, cancellation and late-response retirement
are required permanent controls. Readout stays after-this-move, fixed in the historical rail,
and cannot grant existing grade/eval access, tick or affect run/cursor/branches/provider work.
Only the declared authorized null-to-document metadata transition may write on query.

D1041's simulated drill pressure and real clocks wherever play occurs, bot move-time models,
rating consequences and timed campaign work remain required. D2290's false createdAt/“thinking
time” arm is replaced by honest recorded clock use; the learner's own measured-live arm remains
an explicit real server-issued decision/clock source discharge on enforced-clocks, not a stub
or an implicit deletion. That returned successor must refresh its obsolete ClockReading/run
assumptions before implementation. D361's opaque legacy field and the protected campaign
intent amendments remain explicitly owed; this RFC makes neither a false closure nor an owner
ruling. Broadcast integration likewise remains a conditional live-sources discharge without
blocking independent correct paste/fetch extraction or advertising an unbuilt handoff.

All acceptance evidence must still be implemented and executed, including hermetic sparse,
setup/truncated-start, malformed/duplicate, transaction/CAS/account, exact original-node,
REST/strict parser, mounted layout/lifecycle and actual native delivery controls. Reviewer ran
no tests/builds or heavy commands, changed only this append-only review and the separately
requested four-source execution follow-up receipt, and did not edit/stage/commit production,
RFC, protected intent or archive bytes. Main may now record this separate contract acceptance;
it must not count it as source4/full foundation/clock implementation or release completion.
