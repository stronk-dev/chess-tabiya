# RFC: Recorded clocks — retained game clocks and grounded clock use

- **Status:** implementing — independently accepted2026-11-04; retained parser/SQL32/account/source/occurrence and registered historical API/strict selected-move readout are locally verified2026-11-05 after independent reviews and final14464software/526+7performance/types/build. Full details: planning/time-controls/implementation-2026-11-05.md. WholeD5/native desktop/tablet/phone and live/enforced/broadcast/longitudinal/bot/rating discharges remain open; no archival or release claim. The 2026-08-30 return remains preserved history.
- **Author:** claude; 2026-11-04 repair by Codex's delegated source reviewer, for separate independent acceptance.
- **Created:** 2026-08-23
- **Design refs:** design/05-in-run-experience.md §§1–2 (truthful absence and the assistance/evidence rail); design/03-product-breadth.md Library/Review; design/06-campaign.md §5 refusals.
- **Owner authority:** D1041 rules both simulated pressure in drills and real clocks wherever games are played, including bot timing and rating consequences. This RFC supplies recorded facts; it does not cancel the rest of that ruling.
- **Exploration gate:** D1093, D1041 and the logged 2026-08-12 drafting override. Existing research: planning/time-controls/rfc-derivation.md; design/research/time-as-a-difficulty-lever.md.
- **Depends on:** existing own-game import, storage and authenticated recorded-prefix operations. live-sources is a returned/repaired draft awaiting review, not an implemented broadcast handoff. Its selected-game integration remains conditional. enforced-clocks is also returned; it owns live clock authority, not this RFC's PGN extraction.
- **Coordinates:** accepted foundation-source-identity §3.8 owns run.record.clock_decision@1 and clock-spend-input@1. This RFC owns the retained source data/types/operation that make that source possible; source implementation is staged rather than mutually blocked on completed parent RFCs.
- **Planning:** planning/time-controls/

```tabiya-claims
none
```

This repair releases the unused run-schema0.20 claim: it does not narrow Node.clockState or alter
the persisted run/event schema. The additive clock document is now installed locally at migration32, independently of the returned
live-sources migration. Parser/storage/account implementation is in flight and uncommitted; actual
source/API/readout and verification remain owed. Routine
pre-launch ordering may be rebased by its implementing engineer; no other claimant is renumbered
here. D361's opaque field remains explicit debt owned by the real-clock/schema repair, not
falsely closed by displaying another source.

## Summary

Preserve the original player's numeric clock facts **before** removing commentary, then show the
recorded remaining time at its exact original move. Where a supported declared control and
adjacent same-player samples exist, supply the exact recorded clock-use arithmetic. The display
does not tick, expire, grade a move, predict deliberation, infer thought, or charge for a rewind.

D1041's simulated-pressure, real-clock and bot-timing arms remain required. A PGN fact is not a
live clock. The old sentence “You spent 8 seconds here” cannot be grounded by Node.createdAt:
client values are arbitrary and ordinary gaps include provider/network/background/import work.
A learner's own measured live clock use remains owed to enforced-clocks' real server authority;
it is not replaced by fabricated timestamp arithmetic or marked complete by an unavailable stub.

The data-loss correction is part of this feature, not optional preparation. Current
resolveImportSource calls stripPgnAnnotations for paste and fetched games before RunService
stores source.pgn; the recursive stripper replaces move data with {san}. Remote export also
requests clocks=false. D2021 already records this exact loss. Stored PGN is therefore not
universally “raw PGN with clocks”: historical retention may be unknown and removed values cannot
be reconstructed by reparsing. D1048 specifies extract-before-strip for the future broadcast
handoff; it is a contract, not production code.

## Specification

### 1. Existing intent and preserved vocabulary

clock_zeroed remains the halfmove/fifty-move counter. timingWindows/luxuryMoveBudget and
TempoVerdict remain move-count concepts. No existing symbol is renamed to free a clock word.

Use:
- **RecordedClockSample:** remaining clock after one exact original recorded move.
- **ParsedTimeControl:** one validated declared base/increment interpretation.
- **RecordedClockUse:** arithmetic over adjacent same-player recorded samples plus increment.
- **Live clock:** server-owned timing, flag and pause semantics belonging to enforced-clocks.

The existing ladder/region boundaries remain. A historical readout occupies the assistance/
evidence rail's existing content space, never the stage/board geometry. This introduces no
assistance preference or source-risk ceiling term, and does not alter another grade/hint's
permissions. Its exact source, timing, role and historical-prefix admission are still enforced.

No protected intent file is edited by this RFC. When implementation makes design/06's
“no time control at all / clockState ... nothing reads” sentence stale, the implementing commit
must carry the exact proposed intent correction under planning/platform-alignment. Recorded
readout completion must not claim a running clock or close the campaign timing ruling.

## 2. Historical research, with the correct grain

The 2026-08-23 convenience corpus in tools/r2-selection-harness/imported-sample.pgn contained
108 games, 108 with clock annotations, 108 with declared controls and6,991 annotations.
This establishes useful source examples, not current production retention or prevalence.

The broadcast fixtures contain902 annotations in the finished10-game round and256 in the
ongoing10-game round, with no declared controls. The 2026-08-30 fresh review found clocks in
**nine of the ten finished games**, including one finished board with no clock annotation.
The902 total is a round census, not a selected-game receipt. No population count is a CI gate.

Historical review:
planning/time-controls/recorded-clocks-fresh-independent-buildability-review-2026-08-30.md.
Its eleven checks describe that return; they were not rerun to accept this repaired contract.

## 3. One source parser, exact move identity

Implement a shared pure parseRecordedClockGame over one selected, fully legal Standard PGN.
Use the existing single-game/root/mainline validation,64KiB source bound and300-ply bound;
the parser must walk that same game's mainline comments before stripping them. It must not
flatten rounds, variations or another game's annotations into the selected game.

For each original move, retain its one-based sourcePly, original mover color and exact
canonical UCI. A sample additionally retains remainingMs and the post-move sample convention.
Missing comments do not shift later samples. Root-only annotations are not assigned to an
invented move. Source-local ply is not a FEN fullmove number and survives setup positions.

Clock grammar is a complete [%clk H:MM:SS] token, optionally with one to three fractional
second digits. H is nonnegative integer hours, minutes/seconds are0..59; convert exactly to
nonnegative safe-integer milliseconds without rounding. Reject negative, overflowing, malformed
or unsupported-precision values for that ply. More than one clock tag at a ply is a duplicate,
even if equal: never pick a first/last tag silently. Retain a typed per-ply issue, not raw prose.
A bad/missing sample does not erase valid samples elsewhere.

The parser result is a complete selected-game document: all canonical move identities,
sourcePly/mover identities, sparse valid samples and typed invalid/duplicate issue locations.
No engine assessments, NAGs, comments, names from prose or raw annotation strings enter it.

### 3.1 Declared time control

parseDeclaredTimeControl is shared by this lane and the later live-clock lane:

~~~ts
type ParsedTimeControl =
  | { kind: "supported"; baseMs: number; incrementMs: number; canonical: string }
  | { kind: "absent" }
  | { kind: "invalid"; reason: "syntax" | "unsafe_operand" | "nonpositive_budget" }
  | { kind: "unsupported"; reason: "unknown" | "unlimited" | "staged_or_other" };
~~~

Absent means no/empty header. Trim surrounding header whitespace. Support only two decimal
nonnegative integer-second operands joined by one plus; convert exactly to safe milliseconds,
require base+increment positive and safe, and normalize the canonical seconds form.
Question mark is unsupported unknown; dash is unsupported unlimited; staged/delayed/other
non-simple forms are explicitly unsupported, never guessed to be Fischer increment.
Malformed numeric syntax and unsafe operands are invalid. The implementation must pin the
classification of every branch with literal fixtures; no generic JavaScript numeric coercion.

Derive this result from ImportedGameRecord.headers.TimeControl on every source compilation.
Do not add a timeControl SQL column or infer a control from clock samples, player ratings,
engine settings or a round-level value. Remaining time may be available when control is not.
Live enforcement may impose its own supported-control policy but must reuse this parser.

## 4. Extract before strip, with one declared durable image

### 4.1 Own-game imports and the future broadcast handoff

For paste: validate/parse the original submitted game, extract the typed clock document, then
strip all commentary/evaluations/NAGs exactly as today. Store sanitized PGN plus numeric facts.
For Lichess own-game fetch: request clocks=true while retaining evals=false/literate=false/
comments=false; extract any returned clock tokens before the unchanged stripper. A query-string
change alone is not completion. Include a real clock-bearing resolver→storage fixture.

The future live-sources adapter must pass the same selected game's typed extraction and
sanitized PGN in one operation, bound to that selected game's actual move identity. While its
RFC/implementation is unavailable, no broadcast API/UI is advertised by this RFC. Keep
broadcast integration as an explicit open discharge, not a fabricated implementation or global
block on correct paste extraction. Study/other source paths must either use this same extraction
before stripping or report no retained clock source; they cannot silently claim original absence.

### 4.2 Storage

Add exactly one nullable TEXT column:
~~~sql
ALTER TABLE imported_games ADD COLUMN clock_document_json TEXT
  CHECK(clock_document_json IS NULL OR json_valid(clock_document_json));
~~~
Application getters/restore validate the
closed version1 union; JSON validity alone is not source validation. ImportedGameRecord gains
clockDocument: StoredClockDocument | null. No Node, run event, timeControl column or second
clock table is added.

~~~ts
interface RecordedClockSample {
  readonly sourcePly: number; // positive integer, one-based within this selected game
  readonly side: "white" | "black";
  readonly moveUci: string;   // exact original canonical UCI at sourcePly
  readonly remainingMs: number; // nonnegative safe integer
}
type ClockSampleIssue = Readonly<{
  sourcePly: number; // 0 only for an unassigned root annotation
  reason: "invalid_clock" | "duplicate_clock" | "unsupported_precision" | "unsafe_operand" | "unassigned_root_clock";
}>;
type StoredClockDocument =
  | Readonly<{
      version: 1; status: "ready";
      retention: "extracted_before_strip" | "legacy_stored_pgn";
      movetextDigest: string;
      originalNodeIds: readonly string[]; // root then every original source move
      samples: readonly RecordedClockSample[];
      issues: readonly ClockSampleIssue[];
    }>
  | Readonly<{
      version: 1; status: "unavailable"; retention: "legacy_stored_pgn";
      movetextDigest: string;
      reason: "invalid_stored_pgn" | "original_import_identity_unresolved" | "source_too_large";
    }>;
~~~

All objects are closed. originalNodeIds has exactly original move-count+1 distinct entries;
sourcePly indexes that mapping, not a sparse array. Samples/issues are sorted and unique per
ply; duplicate tags produce one duplicate issue and no sample for that ply. Neither unavailable
nor null carries a successful empty sample list. Document size/counts are bounded by the shared
64KiB/300-ply original import domain; validate before allocation/iteration during restore.

New extraction records the complete source input even when samples/issue lists are empty.
Legacy retention is explicitly unknown beyond the retained bytes. Do not store unlicensed raw
comments or duplicate PGN in this column. A terminal unavailable document retains a closed reason
invalid_stored_pgn, original_import_identity_unresolved or source_too_large, not a successful
empty sample population. Parsing/internal/storage failure is not no-clock evidence.

RunService/import storage binds the document to the original freshly created import nodes and
persists both in createImportedRun's existing transaction, before a learner can branch. Mapping
includes every original source move even when its sample is missing. Duplicate source plies,
duplicate node ids, crossed mover/UCI, wrong count and a mismatched import identity refuse.

Account export includes clockDocument (or null). Restore validates version, source/node joins
and numeric/union constraints transactionally before insertion; id remapping must update its
node mapping consistently or refuse. Account/run delete removes it with imported_games.
No raw clock cache survives deletion. Source selection/role/grant changes retire captured views.

### 4.3 Honest retroactivity and retry

Migration initializes old rows to null; null means not examined under this parser, not no clocks.
An authorized recorded-clock query calls ensureRecordedClockDocument for a null row:
read its existing immutable stored PGN/headers and original import identity, parse it, then
atomically UPDATE ... WHERE clock_document_json IS NULL. Concurrent losers reread/validate the
winner. Commit one complete document or none; interruption before commit leaves null and retries
safely. Transient I/O/internal failure leaves null and returns source_failed, not parsed-empty.

Reconstruct old original node mapping only from the actual immutable initial import event/prefix
and exact PGN root/UCI/FEN/parent joins. Same-ply or merely identical-looking later nodes are not
a fallback. If that original identity cannot be proved, store a terminal unavailable document.
A later source read must not replace a good extracted-before-strip document with a reparse of
sanitized PGN. Invalid persisted JSON/document is source_failed, never an automatic empty rewrite.

Valid retained historical samples can become available without re-import. If historical stripping
removed them, report “No retained clock annotation; original availability is unknown.”
Never promise reconstruction, infer original absence or refetch a remote game silently.
Current complete new extraction with no tag may truthfully say no annotation was supplied.
A parsed-empty legacy document and unexamined null are different states; UI loading/unknown
must not be rendered as original no-clock evidence.

## 5. Typed source projections and exact recorded-node join

This RFC owns the new run.record.clock_reading@1 source: one complete recorded-clock frame at
one original imported move, with its exact subject, sample status and ParsedTimeControl. Sample
status is available with the original numeric sample, no_retained_sample, invalid_or_duplicate_sample
or unknown_historical_retention; a missing sample contains no remainingMs. A valid original-move
frame is an available source even when its sample or declared control is absent. Missing/broken
original-source authority is unavailable instead, never a successful empty frame. Thus control
and absence wording travel with actual declared evidence, not an unfiltered side channel.
It uses the existing
run.record producer/record plane, recorded_run grounding, reported confidence and literal
recorded remaining-time operands. It introduces no new convention. It is necessary because
foundation's separate clock_decision source must be unavailable when spend inputs are missing,
whereas a remaining-time annotation is still a useful depicted fact.

The actual source owner is server-owned recordedClockOperation over RunStorage, using
requireRead before any parse/storage/provider work. Inputs are only principal/runId/branchId/
nodeId. It loads its own StoredRun and ImportedGameRecord, authorizes the exact frozen prefix,
and captures the validated document/source identities. No caller PGN, FEN, samples, actor,
event head, clock/control values or callbacks can mint the source.

Original-node mapping is necessary even when two nodes have equal ply/FEN/UCI. Learner-created
alternatives do not inherit clocks; actual shared original ancestors may retain their own clock.
Match source root and every original parent/move/FEN through the requested source node.
Root/no incoming move, wrong run/branch, inaccessible or broken source never guesses a sample.
A captured source cannot outlive its exact run/event head/selected node/access identity.

The sole createRunRecordClockReadingV1Evidence factory consumes that private original source,
recomputes the closed typed frame and
retains its original input membership. A publicly re-sealed same-symbol/digest wrapper or caller
written document does not satisfy it. This source protocol is not a generic evidence constructor.
Register it as a source_record with state sign, fact/list/panel forms, exact source transcription
and no strategic/evaluative content. This additional dependency-owned source is explicit; it is
not silently added to foundation-source-identity's23-source/five-predicate image.

Foundation owns run.record.clock_decision@1 and clock-spend-input@1. Its actual captured input
resolves the exact original actor/decision/event, phase and current/same-side previous clock,
base/increment and source event through this owner. Imported actor class is imported, never
learner merely because that side is selected. Register/execute that factory only when its
actual data authority exists; source metadata or an unavailable-only stub is not completion.

For clock-use arithmetic the previous sample must be the immediately preceding decision of
that same original side, not the nearest available tag across a gap. At an established standard
initial-game first decision, declared base may supply the initial prior reading; a truncated or
unproven start cannot. Compute availableMs=previousMs+incrementMs and clockUsedMs=availableMs-
currentMs, with exact safe integers. The comparison allowance includes the post-move increment;
it does not claim that increment was already available while choosing the move. Missing
control/previous/current/decision history,
nonpositive available time, overflow or current>available is typed unavailable. Zero use is
a genuine arithmetic result, not a missing-source substitute. Retain all operands and prior
source ply. This is recorded clock use, never measured cognitive deliberation.

## 6. API, strict receiver and fixed historical readout

RunService.recordedClock invokes the source-owned operation. Add authenticated read-only
GET /runs/:runId/recorded-clock?branchId=...&nodeId=... with no other authority fields.
Not-found/access failure is the existing non-disclosing404 (anonymous401). Validate duplicates/
extra query keys and ids. A public Story token is not this principal. No source acquisition occurs
for unauthenticated/refused subjects. Query may perform only the declared null→parsed metadata
transition; it never writes run events/cursor/branches, fires an engine or contacts a remote source.

Its closed recorded-clock-view@1 wire response contains exact subject identity, reading status,
ParsedTimeControl and recorded-use status. Subject contains runId, branchId, selected nodeId,
original source nodeId/sourcePly when resolved, and the frozen event-head identity; unknown
source fields are omitted through a discriminated unresolved subject, never invented.
Statuses distinguish available, no_retained_sample,
invalid_or_duplicate_sample, unknown_historical_retention, missing_context, source_failed and
the spend-specific unavailable reasons. Do not collapse invalid, not examined and examined-empty.
Unavailable responses carry no made-up clock value, actor or successful evidence item.

Declare review.recorded_clock@1 as an explicit recorded-clock consumer; no implicit addition to
Nudge, Hint, bots, ratings or longitudinal constructors. It accepts clock_reading@1 and the actual
foundation clock_decision@1 only when installed, each with its registered bounded renderer.
It is historical/review, role/read-authorized, optional-source/honest-empty, max2facts/50words/
0board marks/0arrows. Both routes, actual operations and exact source/renderer bindings must be
registered together before claiming the learner delivery path. No fake future accept or raw
sentences bypass. Parsed wire is structural delivery data, not proof of a server-private seal.

The two source-specific renderer ids are review.clock_remaining@1 and review.clock_used@1,
both fact_statement components bound to those exact consumer/projection tuples. The first
formats the original side/remaining milliseconds or its truthful sample/control absence; the
second formats only the available
clock-use result with its complete previous/current/increment operands. Formatting preserves
millisecond precision and licenses no adjective or thinking-time statement. Each successful
wire item carries the existing closed presentation receipt/source identities; failed/unavailable
statuses carry no successful item. Add these exact adapters to the current presentation
registry/parser, not a generic arbitrary-sentence path or an inspector-only private endpoint.

The strict DrillApi parser rejects extra fields, nonfinite/negative/unsafe values, wrong subjects,
duplicate/crossed source identities and impossible arithmetic, before returning the exact typed
readout. Crossed source/run/node/budget/renderer/convention receipts refuse. Preserve existing
source admission and presentation ceiling rules; clock data grants no extra engine/grade access.

ClockReadout in the existing historical Review/imported companion rail uses fixed-height,
monospaced numeric slots and a visible “Recorded clock” label. At the selected original move,
show the mover's retained remaining time and optional recorded clock use; control absence is
separate and visible. Remaining time is labelled **after this move**: an after-move clock tag
does not establish how much time the player had before choosing it. It does not tick or
move/shrink/overlay the board. Pending, unknown,
invalid and unavailable states fit the same bounded region and remain accessible text.
Attach it to the selected original historical node only; no future move's clock is exposed.
Selection/run/branch/help/access changes or unmount cancel/retire old requests; late results
cannot resurrect. Clock and existing licensed grade/eval facts may be displayed together, but
clock data never supplies a move grade or new Story ranking.

The measured own-live arm is preserved as an explicit enforced-clocks source discharge:
only real server-issued decision/clock events may later license “your clock used ...”.
createdAt deltas, imports, synthetic bot delay and browser activity are not that authority.
Until then say that live clock use is not recorded; do not count this arm complete.

## Acceptance criteria

All run against committed hermetic fixtures or actual in-memory SQLite/service/REST/component
boundaries. Historical/private prevalence is never required for CI.

1. D2021: genuine paste and fetched clock-bearing PGN survive resolver→extract-before-strip→
   typed document→transactional import. Stored/exported PGN still contains no comment/eval/NAG/
   clock prose. A query-string-only or extract-after-strip implementation must fail.
2. Sparse both-color samples preserve exact sourcePly/UCI/side; missing middle, duplicate,
   malformed, zero, fractional, overflow, setup/root and multigame/variation cases cannot shift.
3. Supported/absent/invalid/unsupported control branches, exact integer units and canonical
   round trips; clocks with no control display remaining time and abstain on spend.
4. New extraction-empty, legacy-null, unknown retention, malformed and terminal unavailable
   documents stay distinct. No parser result turns lost historical source bytes into a fact.
5. Real transaction rollback/retry/concurrent-null CAS, original import mapping and source failure.
   Old retained clocks can project without re-import; stripped legacy rows remain unknown.
6. Complete SQL/account export/restore/delete including corrupted document and source-node
   mismatch; no undeclared timeControl column or clock cache escape.
7. Actual authorized source→factory→REST→strict receiver→ClockReadout for both colors and
   current/inherited original nodes; same-ply/same-looking learner branch receives no clock.
   Anonymous/refused access acquires nothing; repeated queries change no run bytes/provider work.
8. Private captured-source copies, generic re-seals, forged original-node map and crossed source/
   current/previous samples refuse before available or empty source output.
9. Exact original actor/event/decision/phase and adjacent same-side clock pairs; legal zero use,
   initial-base eligibility, sparse gaps, nonpositive/overflow/current>available abstention.
10. Current clock_used/rendered wording says recorded clock use, not thought. Node.createdAt and
    client timestamps cannot satisfy the measured-live arm. Existing grade/eval licenses survive.
11. Real mounted fixed readout/lifecycle and strict grammar; all clock states at desktop/tablet/
    phone keep board layout and default composition intact. Actual native journey remains required,
    with real startup/content blockers reported separately, never bypassed.
12. No clock changes halfmove/tempo, run/event schema, assistance axes, outcome/rating,
    rewind economy or bot timing. Real clocks/bot timing remain on their explicit full1.0 owner.

Source tests prove implementation, not external clock correctness. Imported PGN is supplied
recorded evidence, not authenticated proof that a real player or remote server obeyed that clock.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | D1041's real clocks, expiry/pause/flag authority, bot move-time models and rating consequences | enforced-clocks and bot/rating owners | actual accepted successor and execution receipts | |
| D2 | Exact protected-intent proposal when a shipped recorded readout makes design/06's no-clock sentence stale; existing D364 owner amendments remain distinct | OWNER (codex proposes; owner/claude-on-ruling authors intent) | implementation commit and accepted intent correction | |
| D3 | Timed drill enforcement versus informational pressure and its hint/rating consequences | planning/time-controls/rfc-derivation.md (existing owner decision lane) | successor's recorded ruling | |
| D4 | Clock/time-control identity in actual longitudinal observations and their opportunity denominator | longitudinal-store owner | accepted source/constructor revision and real ingest controls | |
| D5 | Complete recorded source/parser/storage/API/readout implementation with all acceptance controls | codex (implementing engineer) | normal gates plus actual source/native delivery evidence | |
| D6 | Selected-game extract-before-strip broadcast handoff and the same typed storage/source path | live-sources owner | accepted predecessor and real selected-game operation controls | |
| D7 | Learner's own measured-live clock use from real server clock events, never createdAt deltas | enforced-clocks owner | accepted authority plus actual two-sided decision lifecycle controls | |

## Trace of existing repair obligations

| Existing obligation | This repair | Residual owner / closure rule |
|---|---|---|
| D2021 | request+extract-before-strip+typed persistence+account lifecycle as one unit | closes only on actual service/REST/readout proof |
| D2286 | truthful dependency statuses; no already-shipped broadcast extractor; release unused run claim | broadcast implementation waits on accepted live-sources |
| D2287 | exact per-game/source-ply/side/move and original node mapping | closed only after sparse/counterfeit/join controls |
| D2288 | explicit source operation/factory/API/strict renderer/readout chain | actual occupied learner journey, not interfaces alone |
| D2289 | shared closed parsed control authority | no independent parser in enforced clocks |
| D2290 | remove false timestamp inference; retain measured-live arm on its real authority | enforced-clocks owns live measurement; not declared done here |
| D2291 | atomic new import + idempotent null legacy parse, terminal/transient distinctions | honest unrecoverable historical retention |
| D2292 | hermetic correctness/source-boundary tests | prevalence remains optional historical research |
| D2293 | raw Node.clockState is never a validated clock projection | D361 cleanup/narrowing remains real-clock/schema owner's debt |
| D2294 | selected game9/10,902 round census only | selected zero-reading game fixture |
| D2295 | one declared document column; controls derive from retained headers | exact account lifecycle/restore validation |
| D1041 | both original timing arms remain required | enforced play/drill rules, bot move-time models and rating interaction remain owed |
| D364 | no run-pooled clock or rewind time price | protected-intent amendments remain owner/claude-on-ruling duty |

D361 is not closed by leaving its field opaque. D330's mechanism request, own-live measurement,
broadcast integration and campaign/native real-clock work remain tracked. No predicted human
deliberation is licensed; this is the refusal of ungrounded output, not refusal of real clocks
or the owner's bot-timing requirement.

## Open questions

No new product ruling is required for the bounded recorded-source implementation. Unresolved
questions retained from the existing lane remain explicitly assigned to the discharges above:
- Owner-use may prefer a nearer historical readout; the existing rail is the bounded initial
  implementation, and owner-device legibility remains to be observed.
- Whether timed drills enforce failure versus remain informational, and how rated time-control
  identity joins rung calibration, remain enforced-clocks/rating decisions. This RFC does not
  decide them or block grounded recorded facts on them.
- No source trace justifies a learner-thinking-time claim from app events. Its exact live source
  remains an open implementation/authority discharge, not an inferred product ruling.

No protected intent, immutable archive or historical log is rewritten.

## Changelog

- 2026-08-23 — initial draft from the D1041 lane derivation under D1093; historical convenience
  corpus measured before drafting.
- 2026-08-30 — fresh independent review returned the draft on D2286–D2295; retained in
  planning/time-controls/recorded-clocks-fresh-independent-buildability-review-2026-08-30.md.
- 2026-11-01 — resource references synchronized with the pre-launch telemetry rebase; no acceptance.
- 2026-11-04 — author repair traces D2021's extract-before-strip loss, preserves per-game/source-ply
  identity, adds one exact typed document/account image and original-node source chain, separates
  truthful retained-clock arithmetic from missing live authority, releases unnecessary run-schema
  narrowing and keeps both D1041 timing arms/remaining dependencies visible. Draft only; no
  implementation or acceptance is claimed.


- 2026-11-04 lifecycle: independent reviewer accepted the separately authored repair after
  tracing real ingress/storage/account/source/REST/client paths and first-decision/sparse/control
  boundaries. Main records acceptance only; no clock code, migration, source/API/readout, native
  evidence, D1041 live/simulated timing arm or whole clock capability is completed by this entry.

- 2026-11-05 — retained original parser/document/SQL32/account/CAS and disclosure subset implements
  locally with independent source/meaning reviews and final normal software/performance/current
  types/build; content retains its exact prior60failures. D4123–D4126 close bounded defects.
  Detailed proof/next private source/factory/actor/API/readout contract is in the existing time
  implementation plan. Parent and discharges remain implementing; no source28 or UI-clock claim.

- 2026-11-05 — actual original source/reading1/decision1 and clock-specific imported occurrence
  pass independent source/meaning reviews and final14434software/524+7performance/types/build,
  source-author11 and exact unchanged62-heading red-content comparison. D4127–D4129 close
  boundedly; all28 foundation factories exist. Parent remains implementing: actual historical
  consumer/API/strict receiver/fixed readout and native/live discharge remain open.

- 2026-11-05 — historical source→registered consumer→authenticated API→strict receiver→fixed
  selected Review readout is verified locally after independent source/UI reviews, actual
  emitted-handler and grant-revoke controls, final14464software/526+7performance/types/build and
  source-author11. Content remains the exact prior60failures/62headings. Finite D2021/D2287–89/
  D2291–92/D2295 and implementation-return rows close; IMP-a6 own-game retention is complete.
  D2286 is dependency/claim repair only. D5/native, D1041, D2290/D2293/D2294 and other discharges
  remain open. D2 proposal: planning/platform-alignment/recorded-clocks-intent-amendment-2026-11-05.md.
