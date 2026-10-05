# Review reservations and shared completion

D3422/D3423 implement the existing `review-evidence-compiler.md` §4.1 concurrency contract.
This checkpoint does not finish Review source coverage, the RFC or a 1.0 milestone.

## Reproduced predecessors

Four permanent controls fail against the preceding coordinator: pending discovery reserves zero
slots, evicted discovery attaches evidence to its former run, branch admission does not share
the per-run limit, and a concurrent same-source run remains incomplete after the owner settles.
The normal Review gate records four failures and 33 passes before the production fix.

## Production repair

The coordinator reserves exact node/FEN work synchronously, then awaits the shared pending engine
lookup with cancellation detachment. Capacity includes every reservation/subscriber across all
tracked branches of one run. Changed branch occurrences cancel obsolete work. Tracker identity,
reservation identity and current branch node/FEN fence execution and attachment; late results can
neither attach to an evicted tracker nor delete a replacement reservation.

An attempt subscriber waits for the existing scalar completion. Only its owner executes and
settles provider work. Failure/exhaustion propagates to every subscriber; cancellation detaches
only that occurrence. After success is attached and its scalar slot released, another occurrence
can become the next owner and obtain the shared scheduler's exact retained delivery. Each run
records its own durable event, without a payload cache in the attempt store or another physical
search while that exact delivery remains retained. The scheduler's bounded retention still governs
reuse; eviction may legitimately require a new search, never reconstructed evidence.

Completion wakes every previously requested branch of the same run, including exclusive fork
suffixes, without Story polling. The wakeup registers fresh work rather than retaining an ancestor
promise per ply. Discovery failure remains recoverable on a later authorized ensure and does not
create an automatic retry loop or reset attempt history.

## Verification scope

Permanent controls use the actual provider scheduler/parser and SQLite. They cover discovery,
repeated ensure, cross-branch capacity and an exclusive suffix, pending eviction, a native result
ignoring cancellation, shared success/failure, subscriber eviction, surviving owners/subscribers,
failure ceilings and unchanged scalar capacity semantics. The authenticated production HTTP test
holds the actual coordinator's initial gateway calls across two imports, then releases them and
observes seven durable attachments per run using SQLite alone. Only after both finish does it
read Story, proving settled coverage, source-private wire filtering, authenticated access and no
extra work on settled reads.

These are labelled mock-provider contract controls, not real-engine speed, chess judgement,
human-likeness or owner-use measurements. No source factory, schema, chess collector, search
profile, assistance permission, preset or authored content changes. No protected intent sentence
is changed or newly falsified. Full gate results are appended before commit.

The normal `make review-evidence-runtime-check typecheck` passes 47 tests/three files with zero
workspace errors or Svelte warnings. Two intermediate fixture type annotations were corrected
before that terminal pass; they are not counted as product failures or bypassed by the test runner.

## Exact-index software proof

`make staged-software-contracts` exits 0 at index tree
`4a9d4e7be9c52fd1af18a85e03496ecfa3105bae`: 3,195 software tests/336 files,
seven isolated performance tests/four files, warning-free workspace types, and complete
build/scaffold/packaging/release-policy/value/source/semantic/capability/history/migration checks.
All 970 declarations remain current; the canonical 352-document migration plan has zero
mechanical, judgement, refusal or ledger-restamp rows. Proof:
`reservation-completion-software-2026-10-05.json`. All four changed software/Make paths are
byte-identical to that tested tree. Subsequent proof/tracker/log bytes are checked separately,
never misrepresented as this software snapshot.

## Complete local closeout

`make verify-content` exits 0: 225 tests/23 files, 92 clearance documents with zero errors,
and all 104 capability documents matching their derived requirements. `make test-browser-ci`
exits 0 after fresh application builds: 121 passing journeys (66 smoke, five real-content,
49 viewport/input/accessibility matrix and one packaged-default), one existing optional real-Maia
skip, zero retries. Review/import/Analyze/retry/Compare, Support/Hint recovery, registered bots,
Campaign/resume and exact endgame moves across all five input modes/viewports remain green.

`make verify-governance` passes the register, lifecycle, source-state, roadmap, intent, test-tier
and staged-process guards: zero untriaged/1683 live, with no item doing. Final tracker/log bytes
are staged explicitly and checked by governance and the normal commit hooks. Only D3422/D3423
close; full source/RFC/capability/milestone and owner-use obligations stay open. Unrelated shared
edits remain excluded, and nothing is pushed or represented as a GitHub/published-release result.
