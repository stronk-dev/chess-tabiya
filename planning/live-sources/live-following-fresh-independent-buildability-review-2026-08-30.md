# Live-following — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/live-following.md`, joined to current source/import, evidence, account-data,
  UX and dependency contracts
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make live-following-fresh-review` — 11/11 findings
- **Production status:** Phase A is accepted but unimplemented; no follower, growing-source
  persistence, cut provenance, live lock, API or web journey is authorized

The document gets its central product model right: a broadcast source grows while every rehearsal
run remains an immutable copy. It also correctly refuses engine evaluation while the real game is
live. Those conclusions survive. The build contract around them does not. The proposed rows cannot
derive the promised liveness or supersession state, the release predicate contradicts its own
connection lifecycle, and the RFC has no production operation or learner journey.

## B1 — decisions and dependency states are stale ([[D2266]])

Open question 1 still calls the B5 ruling acceptance-blocking, the summary still says casting is
blocked on it, and D1 is blank. [[D1272]] ruled the opposite on 2026-08-23: live following is
ungated, uses the held stream, and casting is a separate integrated surface. [[D1211]] also records
the followed-source/immutable-cut growth model as decided, while open question 2 still presents it
as an owner fork. Criterion 12 still has the tree-wide grep shape [[D1513]] explicitly ruled must
be diff-scoped.

The dependency preamble is equally stale. `intent-presets` and `longitudinal-store` are returned,
not accepted/implementing; `recorded-clocks` is draft; and accepted Phase A has no production
symbols at HEAD. Rewrite the dependency and decision table from the registers before changing any
technical clause. This does not erase history: retain the prior questions and show their dated
answers.

## B2 — the persisted lifecycle cannot represent the lifecycle in the prose ([[D2267]])

`followed_sources` stores a Boolean `source_live`, timestamps and current PGN fields. The normative
algorithm also says to mark a source contaminated, mark it revised, remember connection loss,
re-derive after restart, retain a round-finished fact and coordinate the all-boards-terminal release.
None of those states has a field or a derivation authority. A Boolean conclusion cannot replace the
facts needed to re-derive that conclusion after a crash.

Publish a closed follower state machine and its exact persisted operands: round state/revision,
board terminal state, connection/reconciliation state, contamination state, current snapshot
identity and last admitted push. Make restart recovery consume those operands rather than trusting
a stale Boolean.

## B3 — superseded cuts are not computable ([[D2268]])

The push table stores only source, sequence, receipt time, ply count and a four-value revision
label. It does not store divergence ply, previous/current snapshot digest or corrected header
identity. More decisively, neither proposed table nor `ImportedGameRecord` links a cut run to the
followed source and exact push from which it was copied. Therefore §2.4's “read-time projection over
`followed_source_pushes`” cannot identify either the cuts to inspect or whether their prefix crosses
the correction.

Define a durable cut receipt keyed by run id with source id, admitted push id/snapshot digest,
cut ply and source rules identity. A revision receipt must retain enough old/new identity and the
exact divergence to reproduce supersession without replaying mutable current bytes.

## B4 — the release predicate re-locks a completed game ([[D2269]])

Criterion 6 says the only unlocked cell is `terminal ∧ finished ∧ connected`; §3.3 separately says
connection loss locks. But the held stream ends or is closed when the round finishes, and §1.3 calls
round end the release trigger. Once that connection is gone, the criterion turns the lock back on.
The document has confused confidence in a positive terminal observation with a live socket.

Use an explicit monotone terminal receipt. Unknown/disconnected before that receipt remains locked;
after a trusted sanitized terminal+round-finished observation, ordinary connection state cannot
undo it. Specify the transaction that releases every board of the round and the correction/reopen
policy if upstream later changes a terminal snapshot.

## B5 — no run can derive `sourceGameLive` ([[D2270]])

The cut is defined as `importGame` “unchanged,” the RFC claims no run-schema lane, and the shipped
`ImportedGameRecord` contains only ordinary import provenance. Yet every refusal starts from a
run id and needs to discover the source's current liveness. With no cut receipt or imported-record
link, the server cannot distinguish a cut of a still-live source from a finished broadcast import.
The central safety property is therefore uncallable from the operations it is meant to guard.

Name the one lookup from run id to cut receipt to followed source to durable liveness state. Bind
authorization and not-found/deleted-source behavior, and cross live, released, deleted, revised and
ordinary imported runs.

## B6 — the four-door refusal census is obsolete ([[D2271]])

The RFC names evidence auto-enqueue, Story, Compare and public-token minting. The current production
route family also exposes raw evidence, analysis, human split, corpus, voice, speech, reasoning and
reasoning-review paths, and the evidence/module architecture now has a compiled consumer manifest.
Guarding four historical call sites can leave a live source readable through another admitted
consumer while every criterion passes.

Make the live-source ceiling/refusal an exhaustive operation property joined to the current
producer→consumer manifest. The test must fail when a new evidence-bearing route or background
producer is added without an explicit live-source disposition. Route-level negative tests remain
useful, but they are witnesses, not the census authority.

## B7 — there is no follower command/result or update protocol ([[D2272]])

The RFC describes an internal `onPush` sketch but defines no request/result unions, HTTP endpoints,
authorization, idempotency key, start/attach/stop/retry operations, status read, update transport or
typed error mapping. It also never decides what “later followers attach” means across learners or
processes. Implementers could ship incompatible service-only methods, polling endpoints or global
mutable state and still satisfy most criteria.

Specify the complete operation family through the production application boundary: discover/open,
follow, read status, create a copy, stop/detach and reconcile. Each mutating command needs stable
identity, replay behavior, stale-source behavior, provider-off behavior and authorization.

## B8 — push admission has no atomicity or idempotency authority ([[D2273]])

Whole-game snapshots repeat on first burst, reconnect and no-op updates. The local `seq` has no
specified allocator, snapshot digest or uniqueness rule; `onPush` does not say whether the audit row
and current-source update are one transaction; and two fan-out tasks can race. A crash can advance
the current PGN without its audit receipt or record the receipt without the bytes. Replaying the
same upstream snapshot can create a new semantic event each time.

Canonicalize each sanitized snapshot, persist its domain-separated digest, and define one atomic
compare/admit result union (`extended`, `revised`, `header`, `duplicate`, `contaminated`, `stale`).
Cross duplicate first burst, reconnect replay, concurrent arrival, crash boundaries and a corrected
older prefix.

## B9 — ownership, account lifecycle and retention are absent ([[D2274]])

The new tables have no learner/tenant ownership or declared global-cache semantics. The RFC says
many learners share one upstream round connection, but never separates shared fetched bytes from a
learner's follow subscription. It also says nothing about account export/deletion, backup/restore,
retention, orphan cuts or source deletion. Those omissions are release defects for a new persisted
personal workflow, not cleanup after implementation.

Define global source/cache ownership separately from learner subscriptions and immutable cut
receipts. Add exact export/delete/backup/restore behavior, cascade/refusal rules and a retained-cut
case where the source cache is expired.

## B10 — clock storage is promised and absent from the claimed schema ([[D2275]])

§7.4 says growing clock readings live on the followed source and a cut copies its prefix into
`imported_games.clocks`. The `followed_sources` table contains no clock column or child table, and
the push audit cannot identify which reading set accompanied a snapshot. D5 asks for “one agreed
sentence,” but a sentence cannot store the data.

Coordinate an exact per-push clock receipt with `recorded-clocks`: parsing, missing/partial clocks,
revision, snapshot identity, cut copy and release all need one typed authority. Keep this RFC behind
that returned/draft dependency until both documents name the same bytes.

## B11 — rules/variant admission and prefix-revision evidence are still open ([[D2276]])

All executed Phase-A fixture games were Standard. The followed-source and cut receipts name no
`rules + setupFamily`, while the broader variants contract is returned. A live Chess960 or other
variant broadcast therefore has neither a typed admission nor a typed refusal. Separately, §1.4's
required 30–60 minute revision measurement still has no harness/result and criterion 3 says it is
unsatisfiable without one.

Run the prefix-revision instrument before acceptance. Define the supported rules matrix from the
shared chess-subject authority; refuse unsupported variants before following, and cross the same
FEN under different rule identities. Do not infer rules from FEN or silently label all broadcasts
Standard.

## The missing learner journey

The landed UX research already specifies the minimum shape: discover broadcasts in-app; open a
round and board grid; state prominently that no evaluation is computed while play is live; show
“your copy at move N” while the source advances; state upstream corrections; and expose one
integrated “Cast this” action without turning following into casting. None of those actions appears
in the RFC or its criteria. The author repair must consume that research and add browser/mobile/
accessibility acceptance paths. A correct hidden follower is not the 1.0 capability.

## Repair order

1. Run and land the prefix-revision measurement; reconcile ruled questions and dependency states.
2. Publish the round/source/push/subscription/cut identities and the durable liveness state machine.
3. Define atomic push admission, restart/reconnect and release/reopen semantics.
4. Bind every run evidence consumer through an exhaustive live-source disposition.
5. Specify the production API and the complete discover→follow→copy→rehearse→release journey.
6. Close clock, chess-subject and account-lifecycle seams; then repeat independent review.

No implementation is authorized by this return.
