# Pack capability contract — review history (moved out of the RFC, 2026-09-06)

This is the round-by-round narrative that lived inside `rfc/pack-capability-contract.md` between
its "Deviations from design" and "Acceptance criteria" sections, plus the pre-2026-09-06 changelog.
It moved here in the cut of 2026-09-06 (`planning/pack-capability-contract/cut-2026-09-06.md`)
because it recorded process, not contract: **620 lines of the 3,022-line document** described what
seventeen review rounds asked for and what each repair answered, and no dependent of the RFC needs
any of it.

Nothing here is superseded and nothing here is discharged. The per-round evidence and executable
reproducers already had homes as sibling files in this directory
(`fresh-independent-review-2026-08-30.md` through
`seventeenth-fresh-independent-buildability-review-2026-09-06.md`), and this file is the index over
them. **The findings from the fifth round onward ([[D2429]]–[[D3008]]) are about material that left
the parent RFC in the same commit** and are now open against
`planning/pack-capability-contract/evidence-job-durability.md`, not against the parent.

Bytes below are verbatim from `rfc/pack-capability-contract.md` at `c37c6eb8` — review sections from
lines 1884–2503, changelog entries from lines 2816–3022.

---

# Part 1 — round-by-round obligations and returns

## Fresh-return author obligations (2026-08-30) — discharged by this amendment

This live RFC owns the next author pass; the review rows are not free-floating defects:

- [[D2050]] — replace the public ID regex and every parser/criterion positive with one inventory-
  complete base-id grammar and the structured integer/semver result.
- [[D2051]] — publish the complete applicability mapping as reviewed author bytes plus digest,
  rather than asking implementation to create its own authority.
- [[D2052]] — make the strict schema keyword represent every member of a multi-value enum (or
  normalize to annotated const branches), with missing/duplicate/wrong-member negatives.
- [[D2053]] — replace both prose evaluator roots with exact exported symbols and live-reader checks.
- [[D2054]] — point weakened-Stockfish refusal at its protected-design anchor rather than treating
  `AGENTS.md` as protected intent.
- [[D2055]] — replace finite literal pointers for recursive/reused vocabularies with schema-aware
  member selectors evaluated over the finite pack instance.

The author pass inverts `make pack-capability-fresh-review`, preserves the prior 7 + 11 arms and
requests another independent review. It does not implement lane 0.30 or touch corpus bytes.

## Second-fresh-return author obligations (2026-08-30) — discharged by this amendment

This live RFC owns the seven new return seams:

- [[D2070]] — make schema/stamp/corpus landing atomic or specify a real versioned compatibility
  transition that can keep both implementation and content gates green.
- [[D2071]] — separate plan-shape verification from apply-readiness refusal.
- [[D2072]] — publish author-owned post-migration schema bytes or an exact patch/post-image digest.
- [[D2073]] — publish complete member→source/dependency authority, including helpers, tables and
  multiple interpretation sites.
- [[D2074]] — exclude capability metadata from semantic applicability by an exact independent
  authority so the stamp never derives from itself.
- [[D2075]] — define retained per-version declarations, one current version and acyclic successor
  history.
- [[D2076]] — replace schema-ordinal public ids with stable authored/discriminator identities.

This author pass inverts `make pack-capability-second-fresh-review`, preserves the previous
7 + 11 + 6 arms, runs full verification and requests another independent review. It does not
implement lane 0.30 or mutate corpus bytes; the staged authority exists solely so a later accepted
implementation can land without violating D560.

## Third fresh independent return (2026-08-30)

The third fresh buildability review returned this RFC on [[D2152]], [[D2153]], [[D2154]],
[[D2155]] and [[D2156]]. The exact evidence and
repair obligations are in
`planning/pack-capability-contract/third-fresh-independent-review-2026-08-30.md`; the executable
reproducer is `make pack-capability-third-fresh-review` (5/5).

1. The sealed 0.27→0.30 patch must become a legal cumulative transition containing the already-owned
   0.28 and 0.29 post-images, or serialize behind their exact accepted patches. It may not discard
   predecessor claims or invalidate its own source digest by landing after them.
2. The 373 applicability decisions must exist as literal checked rows, or as the output of a
   deterministic generator with a complete independently recomputable source inventory and digest.
3. All unconditional meaning roots and convention tables need exact module-qualified symbol sites
   and transitive dependencies, with zero/multiple matches failing.
4. External packages that contribute chess semantics—including `chessops`—must be exact
   lockfile-resolved meaning sources inside the semantics digest.
5. A withdrawn declaration must retain a typed successor when one exists, and the planner must
   follow that edge; lawful no-successor withdrawal remains explicit and cycle-safe.

This is an author return, not an implementation checkpoint. The D560 corpus hold remains whole and
fresh independent review is required after repair.

## Fourth author repair (2026-08-30) — D2152–D2156

The five third-review blockers are repaired without implementing any schema or product byte:

- [[D2152]] — the transition artifact is now a three-stage cumulative authority with exact 0.28,
  0.29 and 0.30 source/post-image digests and owner documents. The final image asserts every
  predecessor field before admitting the capability stamp.
- [[D2153]] — the applicability artifact publishes its complete 397-row target source inventory;
  `make pack-capability-author-repair` deterministically expands it, proves identity collision
  freedom and recomputes both mapping digests.
- [[D2154]] — all 14 unconditional rows, their dependencies and all 16 constant/convention rows use
  exact repository-relative `module#symbol` sites. The author contract fails zero or multiple
  declarations.
- [[D2155]] — `package_dependency` is a first-class meaning source. The authority pins
  `chessops@0.15.1`, its exact integrity, lock key and four workspace manifest specifiers, with an
  able-to-fail upgrade fixture.
- [[D2156]] — withdrawal is a closed successor/no-successor union; the planner follows successor
  edges and retains typed refusal debt when no migration exists.

The repaired author contract preserves the prior 7 + 11 + 6 + 7 arms and adds five able-to-fail
controls. The historical third-review reproducer is not rewritten. Fresh independent review still
gates acceptance and implementation; [[D560]] still holds the 92-pack apply.

## Fourth fresh independent return (2026-08-30)

The fourth fresh buildability review returned this RFC on [[D2334]]–[[D2339]]. Exact evidence and
repair requirements are in
`planning/pack-capability-contract/fourth-fresh-independent-review-2026-08-30.md`; the executable
reproducer is `make pack-capability-fourth-fresh-review` (6/6).

1. [[D2334]] — publish and check the exact 92 legacy path/raw-digest rows. A count plus opaque digest cannot
   implement a file allowlist, and the author contract must recompute it from those rows and the
   current sealed bytes.
2. [[D2335]] — separate software-transition acceptance from post-apply corpus acceptance. The former must pass
   with the exact sealed unstamped legacy population; only the latter may require all 92 canonical
   `requires` arrays and legacy-reader removal.
3. [[D2336]] — make every unconditional applicability row carry an exact structured `CapabilityId` and selector
   shape. No generator may silently assume version 1 from a base string.
4. [[D2337]] — use one declaration/history identity algebra in specification and fixtures. The author fixture's
   `{subjectId,id:CapabilityId}` rows currently cannot inhabit `CapabilityDeclaration`'s
   `{id:string,version}` shape.
5. [[D2338]] — publish one closed, shared `packCapabilities` response row with separate semantic disposition and
   deployment reachability, and bind the server producer plus web parser/type to it.
6. [[D2339]] — derive transient checks from a closed operation→capability binding or the internally compiled
   pack requirement set. A caller-provided `requiredIds` list cannot be the authority that proves
   itself complete.

This is an author return, not an implementation checkpoint. The D560 corpus hold remains whole and
fifth fresh independent review is required after repair.

## Fifth author repair (2026-08-31) — D2334–D2339

- [[D2334]]: transition artifact v3 contains the exact independently recomputed 92 sorted
  path/raw-digest rows; population movement, edits, deletion, rename/path swap and a 93rd member fail.
- [[D2335]]: pre-D560 software admission proves the exact legacy set plus projected migrations;
  post-D560 corpus admission requires real canonical stamps and legacy-reader deletion. Neither gate
  may impersonate the other.
- [[D2336]]: applicability authority v2 stores all 14 unconditional rows as literal
  `always` selectors with structured integer-version capabilities.
- [[D2337]]: declarations use one `subjectId` plus structured `CapabilityId` identity; successor,
  refusal and cycle fixtures compile with `satisfies CapabilityDeclaration`.
- [[D2338]]: one closed safe public projection separates semantic disposition from deployment
  reachability and is the sole server producer/web parser authority.
- [[D2339]]: operation bindings derive requirements from registered pack/fixed registry facts;
  routes cannot pass ids, every mutation belongs to provider-bound or explicit-no-provider census,
  and first-flight/replay ordering is closed.

`make pack-capability-author-repair` passes the cumulative three-stage/397-mapping author contract,
six new executable repair arms and strict TypeScript positive/negative cases. This is author repair,
not acceptance: no production/schema/API/client/corpus/digest byte changed, D560 remains held, and a
fifth fresh independent buildability review is mandatory.

## Fifth fresh independent return (2026-08-31)

The [[D2334]]–[[D2339]] repairs survive, but the new operation/public boundary returns on three
buildability seams. [[D2429]]: `run.create` is fixed to registered-pack admission even though the
live contract creates pack-less Position sessions. [[D2430]]: the eleven-member dotted operation
union, twenty-two snake-case no-provider actions and coarser REST route branches have no typed
method/route/discriminant projection joining them, so the promised exhaustive census cannot be
implemented as specified. [[D2431]]: the shared public row omits deployment `availability`, while
its parser is required to distinguish a lawful provider transient from an impossible local/build-
time transient.

Repair creation by exact session source, publish one generated route-branch operation map, and
either carry the safe availability mode or separate structural parsing from registry-backed
semantic validation. Exact review and reproducer:
`planning/pack-capability-contract/fifth-fresh-independent-review-2026-08-31.md` and
`make pack-capability-fifth-fresh-review`. No implementation is authorized before another fresh
review.

## Sixth author repair (2026-09-01)

The fifth return is repaired without changing production/schema/API/client/corpus bytes.
[[D2429]] is closed at the author boundary by three distinct creation operations and one sealed
`CreateSessionCapabilitySource`: pack creation derives the complete registered-pack set, while
position and imported creation derive only their policy/runtime set from registry facts. Empty is a
possible computed result, never a route default. [[D2430]] is closed by the 35-operation,
32-route-row `CAPABILITY_ROUTE_BRANCHES` authority in §5.1: method, route template, action and the
four closed body discriminants generate the operation union, binding table and live dispatcher
resolution together. The snake-case side census is deleted rather than translated. [[D2431]] is
closed by carrying the safe four-member `availability` class on the public row; the shared parser
can now structurally reject a transient non-provider row without importing or duplicating the
private deployment registry.

`make pack-capability-sixth-author-repair` exercises the three repaired seams and strict positive /
negative TypeScript cases. `make pack-capability-author-repair` retains the cumulative transition,
applicability and six surviving fifth-repair arms. This remains a draft: another fresh independent
buildability review must attack the creation resolver, route-branch exhaustiveness and public-wire
privacy/semantics before acceptance or implementation. [[D560]] still holds the 92-pack apply.

## Sixth fresh independent return (2026-09-02)

The structured creation-source union and safe public availability field survive, and every earlier
author contract remains green. The fresh source join returns the operation boundary on
[[D2509]]–[[D2512]]:

1. `POST /studio/drafts/:draftId/register` is not a live route; Pack Studio registers at
   `POST /packs/drafts/:draftId/register`.
2. [[D2510]] — a POST/PUT-only, 32-route table cannot be the complete capability-sensitive operation
   population while rated games, draft playtests, repertoire-gap runs, provider-bearing GETs,
   story evidence enqueue and DELETE share revocation exist outside it; flip and duplicate also
   create sessions while declared `none`.
3. [[D2511]] — `run.group` is not provider-free: `human_replies` calls `select` and `engine_top_n` calls
   `enumerate` before durable mutation, but `/source` is absent from the branch authority.
4. [[D1077]] defines two absence causes, not one response. The proposed blanket transient 503
   erases the shipped `honest_empty` arm and contradicts consumers such as branch decidedness.

Exact evidence: `planning/pack-capability-contract/sixth-fresh-independent-review-2026-09-02.md`;
`make pack-capability-sixth-fresh-review` passes 4/4. A seventh author repair and another fresh
independent review are required before acceptance or implementation.

## Seventh author repair (2026-09-02)

The sixth return is repaired without changing production/schema/API/client/corpus bytes.
[[D2509]] uses the exact Pack Studio route and retains `/studio/drafts` as a negative. [[D2510]]
replaces the self-defined 35-operation table with a checked 58-branch author image: all 36
`parseRunRoute` actions and their 48 supported method/body branches, plus ten exact external
creation/registration/provider/public/mutation routes. The implementation must derive that
population from co-located production declarations and independently census the router, provider
gateways and run-creation storage sites.

[[D2511]] splits all four group sources, with only `human_replies` and `engine_top_n` entering the
opponent consumer before any write. [[D2512]] separates the owner's two absence causes from the
compiled consumer effect: `unavailable` returns retryable 503, `honest_empty` returns a typed empty
or unresolved projection, and `available` uses its declared deterministic fallback. No route may
copy this value. The trace also found [[D2513]]: provider operations are valid on Position and
imported sessions, so `run_session_operation` derives fixed operation requirements, session policy
requirements and pack requirements only when a pack exists.

The exact author bytes are
`tools/d2509-pack-capability-seventh-author-repair/operation-authority.json`; the executable and
strict type controls are `make pack-capability-seventh-author-repair`. Earlier author controls
remain cumulative. This is still draft authoring: another fresh independent review must attack the
AST population boundary, nested creation discriminants and all three provider-off effects before
acceptance or implementation.

## Seventh fresh independent return (2026-09-02)

The author repair's 36-action/48-run-branch synchronous image and its exact group/session fixes
survive. Fresh production-boundary review returns the contract on three outer seams:

1. [[D2518]] — `GET /shared/:token` calls the same `publicStory`/Story-evidence path as the declared
   API route but is absent from the ten external branches, proving that population is still not
   derived set-equal from the router.
2. [[D2519]] — `EvidenceJobQueue` calls Stockfish through `EvidenceExecutor.execute` and Syzygy
   through `TablebaseSource.probe`, yet the provider-call census contains no worker site despite
   analysis, moves, imports and Story feeding it.
3. [[D2520]] — analysis returns 202 after enqueue and records provider failure later inside the
   worker; a request-synchronous `unavailable → 503/no write` effect cannot represent provider loss
   after admission or job recovery in another process lifetime.

Exact evidence:
`planning/pack-capability-contract/seventh-fresh-independent-review-2026-09-02.md`;
`make pack-capability-seventh-fresh-review` passes 3/3. An eighth author repair must derive both
public Story branches, close queued provider operations and specify admitted versus settled job
outcomes before another fresh independent review, acceptance or implementation.

## Eighth author repair (2026-09-02)

[[D2518]] is closed at contract tier by resolving a shared token once and declaring two disjoint
HTML branches: `story_read` aliases the existing `story.public` operation and `session_join` is the
local `shared.join_page` operation. The composed route image is now 48 run branches plus 12 external
branches, 60 total over 59 unique HTTP operation ids.

[[D2519]] is closed by a separate queued-operation population: exactly
`evidence.stockfish_analysis` and `evidence.tablebase_probe`, joined to the only two worker gateway
calls and three sealed enqueue origins. [[D2520]] is closed at contract tier by §5.2's durable
`evidence_jobs` algebra. A request admits work; a leased worker settles it. Provider failure after
202 is retained as retry/empty/unavailable, expired leases recover after restart, and shutdown
cannot erase a job. Successful payload, acquisition receipt, staged sequence and consumption share
one row and transactional boundary with event application.

The exact amendment is
`tools/d2518-pack-capability-eighth-author-repair/operation-amendment.json`, digest-pinned to the
seventh-author base. `make pack-capability-eighth-author-repair` passes three able-to-fail author
controls plus strict TypeScript, and the cumulative author contract includes it. This repair adds a
migration position, not a migration number; no production/storage/schema/API/client/corpus byte
changed. Another genuinely fresh independent review must attack token dispatch, worker population,
origin spoofing, lease recovery and cross-transaction crash states before acceptance or
implementation.

## Eighth fresh independent return (2026-09-02)

The token-scope and queued-provider populations survive. Fresh review returns the durable job
contract on six deeper boundaries:

1. [[D2524]] — `StagedEvidence.objectiveProposal` reaches `applyEvidence` but has no durable result
   field, so restart loses or recomputes part of the settled result.
2. [[D2525]] — provider-health permits an `unavailable` result without a fresh failure receipt,
   while F3 requires failure data in every retry/unavailable state.
3. [[D2526]] — automatic move enrichment is admitted after the run save, so a crash can commit the
   node and lose its job.
4. [[D2527]] — analysis is one 1–16-node HTTP batch but the contract admits and tests one row at a
   time, allowing invisible prefixes.
5. [[D2528]] — job id/request digest has no persistent origin-specific idempotency key or dedupe
   grain, so response-loss/restart can duplicate provider calls and evidence.
6. [[D2529]] — rewind cancels queue work before the rewind save; a storage fault cancels work for a
   mutation that never committed.

Exact evidence:
`planning/pack-capability-contract/eighth-fresh-independent-buildability-review-2026-09-02.md`;
`make pack-capability-eighth-fresh-review` passes 6/6. A ninth author repair must define the full
settled result, exact no-failure-unavailable arm, batch/idempotency identities, and atomic
run↔job mutation boundaries before another review, acceptance or implementation.

## Ninth author repair (2026-09-02)

The six returned seams are repaired at contract tier only. [[D2524]] replaces disconnected payload
columns with one exact settlement union whose success arm contains payload, acquisition and
`objectiveProposal` value-or-null; apply consumes those stored bytes without rerunning the upgrader.
[[D2525]] carries the complete upstream unavailable availability and optional real failure in retry,
empty and unavailable arms, so the job layer has no reason or permission to manufacture a receipt.

[[D2527]] and [[D2528]] add the batch authority and three origin-specific key sources. Explicit
analysis atomically admits all 1–16 requests under a validated caller idempotency key; Story and
enrichment use versioned identities derived from immutable branch/node facts. Persistent UUIDs are
returned on equal replay, while an unequal digest under the same scope refuses. [[D2526]] and
[[D2529]] put run mutation plus enrichment and rewind plus cancellation behind two closed storage
operations; runtime rewind loses its queue side effect and no service call may save then enqueue.

The exact author bytes are
`tools/d2524-pack-capability-ninth-author-repair/admission-authority.json` and its strict protocol
types. `make pack-capability-ninth-author-repair` passes six able-to-fail transaction/replay controls
plus TypeScript negative cases; the eighth author controls remain green. The historical eighth
fresh-review reproducer now rejects the four repaired contract absences and still observes the two
expected unimplemented production orderings. No
production, schema, migration, API, storage, content, pack or digest byte changed. Another genuinely
fresh independent review must attack result completeness, optional-failure parsing, concurrent
batch replay, internal-key stability and every transaction fault boundary before acceptance or
implementation.

## Ninth fresh independent return (2026-09-02)

The complete settlement, optional real failure, origin-specific replay keys and joined run/job
transaction direction survive. Fresh review returns six durable proof boundaries:

1. [[D2542]] — child `run_id`/`origin` values are not relationally bound to their parent batch;
2. [[D2543]] — stale-worker refusal names a lease generation the schema cannot store;
3. [[D2544]] — batch/job request digests have no literal canonical preimage or byte authority;
4. [[D2545]] — concurrent same-key admission and persisted batch UUID construction are prose-only;
5. [[D2546]] — rewind cancels conceptual `pending/running/staged` states rather than the durable
   state union; and
6. [[D2547]] — consumed rows retain no run revision/event-range/digest receipt for applied events.

Exact evidence:
`planning/pack-capability-contract/ninth-fresh-independent-buildability-review-2026-09-02.md`;
`make pack-capability-ninth-fresh-review` passes 6/6. A tenth author repair must close the composite
batch identity, exact request image, lease fence, two-connection winner/loser protocol, durable
rewind transition table and application receipt before another fresh review, acceptance or
implementation.

## Tenth author repair (2026-09-02)

The ninth return is repaired at contract tier only. [[D2542]] adds a composite batch identity and
requires exact, contiguous child equality with the canonical ordered batch request. [[D2543]] adds
a monotone lease generation to every claim receipt and requires the same four-field receipt at
retry, cancellation and settlement. [[D2544]] closes the job and batch request types and their
separate canonical digest domains.

[[D2545]] gives both stored identities one UUID constructor and specifies `BEGIN IMMEDIATE` admission
under the existing busy timeout: the second connection waits, then re-reads the committed winner.
[[D2546]] replaces the conceptual rewind vocabulary with a total transition over all eight durable
states. [[D2547]] binds consumption to one non-empty contiguous run-event range, revision pair and
canonical event digest; response-loss replay returns that stored receipt.

`make pack-capability-tenth-author-repair` exercises all six seams, including two real SQLite
connections released from one barrier. The retained eighth and ninth author targets remain part of
the buildability proof. No production, schema, migration, API, storage, content, pack or protected-
design byte changed. Another genuinely fresh independent review must attack the exact SQL/parser
join, concurrent loser behavior, lease rollover, every rewind source state and receipt reload before
acceptance or implementation.

## Tenth fresh independent return (2026-09-04)

The tenth repair's column-level composite foreign key, durable SQL lease counter, separate digest
domains, two-connection lock ordering, eight-state vocabulary and contiguous event-range check all
survive. Fresh review returns seven deeper executable boundaries:

1. [[D2563]] — the retained strict `running` protocol still omits lease generation and request
   digest, so code can compile without the four-field lease receipt;
2. [[D2564]] — its `consumed` arm still omits the application receipt entirely;
3. [[D2565]] — request digests accept arbitrary objects because the author image has no closed v1
   parser and still types batch jobs as `unknown`;
4. [[D2566]] — the composite foreign key binds duplicated columns but the demonstrated image does
   not join batch columns to batch request values, child columns, indexed job request or immutable
   node/FEN;
5. [[D2567]] — rewind is modeled as string-to-string state mapping and cannot observe lease clear,
   generation increment, cancellation settlement or preserved terminal bytes;
6. [[D2568]] — application receipts validate only a non-empty contiguous sequence, accepting
   reversed revisions and events unrelated to the claimed run/node/job; and
7. [[D2569]] — the concurrent gate supplies fixed batch/job ids, so its adjacent declaration of
   `crypto.randomUUID()` is never executed.

Exact evidence:
`planning/pack-capability-contract/tenth-fresh-independent-buildability-review-2026-09-04.md`;
`make pack-capability-tenth-fresh-review` passes 7/7. A bounded eleventh author repair must make the
retained protocol, parsers and transaction models the same authority as the prose before another
fresh review, acceptance or implementation.

## Eleventh author repair (2026-09-04)

[[D2563]] and [[D2564]] are closed by one superseding strict durable-state protocol: a running row
cannot compile without its full generation-bound lease receipt, and a consumed row cannot compile
without its exact application receipt; no other state admits that receipt. [[D2565]] and [[D2566]]
are closed by branded exact job/batch parsers shared by digest writer and verifier, plus a complete
batch-row → batch-request → indexed child-row/request → immutable node/FEN join.

[[D2567]] replaces the label-only rewind model with complete row transitions, including running
generation fencing, lease/retry/result cleanup, the exact superseded settlement and byte-identical
terminal preservation. [[D2568]] makes receipt construction consume the stored success and exact
forward run event array, using the shipped engine/tablebase evidence-reference constructors.
[[D2569]] moves UUID calls inside the lock-held absence branch and makes the concurrent winner/loser
fixture observe two winner constructions versus zero loser constructions for a one-job batch.

`make pack-capability-eleventh-author-repair` passes six executable groups plus strict TypeScript;
every prior author control remains required. No production, schema, migration, API, storage, pack,
content or protected-design byte changed. Another genuinely fresh independent review must attack
the joined model before acceptance or implementation, and [[D560]] remains whole.

## Eleventh fresh independent return (2026-09-04)

The eleventh repair's strict lease/consumption union, outer request-key closure, batch/child request
joins, row-level rewind and winner-only UUID construction survive. Fresh production-boundary and
SQLite review returns six deeper seams:

1. [[D2587]] — valid `immediate_guard` application can append `feedback.generated`, which the exact
   one/two-event receipt rejects;
2. [[D2588]] — `objectiveRequest` is neither parsed exactly nor recursively immutable, so one
   branded request can change digest after admission;
3. [[D2589]] — caller-supplied revisions/events can mint a receipt without an actual retained run
   transition or journal suffix;
4. [[D2590]] — a bare node/FEN map carries no run identity and accepts an equal foreign snapshot;
5. [[D2591]] — the executable admission worker hard-codes `runtime.analysis`, so Story and
   enrichment violate the exact origin/consumer SQL check; and
6. [[D2592]] — rewind clears the only stored result sequence, permitting reuse because no durable
   monotone allocator exists.

Exact evidence:
`planning/pack-capability-contract/eleventh-fresh-independent-buildability-review-2026-09-04.md`;
`make pack-capability-eleventh-fresh-review` passes 6/6. A bounded twelfth author repair must retain
every earlier control while joining complete run effects, nested request identity, actual run
snapshots/transitions, all origins and restart-stable result ordering before another review.

## Twelfth author repair (2026-09-04)

[[D2587]] and [[D2589]] are closed by removing the free receipt constructor. One transaction-owned
operation consumes a parsed CAS before-run and the stored success, constructs attached/objective
events, composes the registered guard's complete result for `immediate_guard`, constructs the
after-run and only then digests the retained appended suffix. [[D2588]] is closed by exact recursive
parsing and immutable copying of the complete live `ObjectiveEvidenceRequest` including policy
locus and versioned engine/model members. [[D2590]] replaces the bare node map with one parsed,
run-identified immutable snapshot.

[[D2591]] derives the child consumer from the sealed origin inside the lock-held winner and races
first flight/replay for all three origins. [[D2592]] adds `evidence_result_sequences`: allocation
and increment happen in the settlement transaction, while rewind may clear the visible job
sequence but cannot erase the allocator. The fixture closes/reopens SQLite between the two
settlements and observes 1 then 2.

`make pack-capability-twelfth-author-repair` first runs the complete eleventh-author target, then
passes six new executable controls. No production, schema, migration, API, storage, pack, content
or protected-design byte changed. A genuinely fresh twelfth independent review is required before
acceptance or implementation, and [[D560]] remains whole.

## Twelfth fresh independent return (2026-09-04)

The next independent pass returned the repair on [[D2673]], [[D2674]], [[D2675]], [[D2676]] and
[[D2677]]. Its new guard constructor
brands caller-supplied emitted events instead of invoking `applyRecordedEngineGuard`; its apply
operation accepts an unparsed caller job and can attach evidence to a node absent from the run; and
both apply and settle accept an incomplete success payload/acquisition that the retained settlement
parser would refuse. The allocator update also checks only job id/run/state, not the required lease
owner, generation and request digest, leaving the completed lease fields attached.

At admission replay, the worker checks the batch digest but returns the persisted child ids without
running `validateStoredBatch`; corrupt child request bytes/digests therefore become a successful
equal-key replay. `make pack-capability-twelfth-fresh-review` retains the full predecessor chain and
passes 6/6 new falsifiers. Exact receipt:
`planning/pack-capability-contract/twelfth-fresh-independent-buildability-review-2026-09-04.md`.
One bounded author repair must compose these authorities before another fresh review or any
pack/schema/storage implementation.

## Thirteenth author repair (2026-09-04)

The bounded repair closes [[D2673]], [[D2674]], [[D2675]], [[D2676]] and [[D2677]] at contract tier.
Application no longer accepts emitted events, caller jobs or caller success shapes. One
SQLite-backed operation loads the settled job and run image, joins the stored request's run/node/FEN,
parses the stored success, invokes the registered immediate guard internally, derives the journal
suffix, advances the run CAS, marks the same row consumed and stores the receipt in one transaction.

Settlement now requires the branded job lease's owner, generation and request digest, validates the
exact success before allocating, and clears the completed lease under the same CAS/counter
transaction. Admission replay loads every child and runs the complete stored-batch/run validator;
application replay re-joins its receipt to the retained journal before returning it. `make
pack-capability-thirteenth-author-repair` retains the complete earlier chain and passes 6/6 repair
groups. Exact receipt:
`planning/pack-capability-contract/thirteenth-author-repair-2026-09-04.md`. This remains author
evidence; another genuinely fresh review gates acceptance and implementation.

## Thirteenth fresh independent return (2026-09-05)

The fresh pass returns the repair on [[D2742]], [[D2743]], [[D2744]], [[D2745]], [[D2746]] and
[[D2747]]. The branded run/job leases are
module-global object identities rather than capabilities issued by one exact application database,
so a lease from database A mutates database B when rows happen to match. Settlement parses a
success in isolation: an eval request accepts a tablebase payload, crossed acquisition generation
and request digest, empty provider identities/endpoint and invalid instants. The same parser rejects
every non-null objective proposal despite criteria 23 and 27 requiring that arm.

Two replay paths remain partial. A consumed job returns successfully after its canonical request
and settlement columns are corrupted, and its receipt accepts arbitrary from/to revisions because
only their difference and event range are checked. Batch replay accepts a caller-supplied parsed
snapshot even after the durable run image has removed the referenced node. `make
pack-capability-thirteenth-fresh-review` retains the complete predecessor chain and passes 6/6
falsifiers. Exact receipt:
`planning/pack-capability-contract/thirteenth-fresh-independent-buildability-review-2026-09-05.md`.
One bounded author repair must compose these storage, provider, result and replay authorities before
another fresh review or any pack/schema/storage implementation.

## Fourteenth author repair (2026-09-05)

The bounded repair closes [[D2742]]–[[D2747]] at contract tier. Run and job lease capabilities are
now issued for one exact application database and fail when crossed into another database with
coincidentally equal rows. Settlement loads the stored running job inside the transaction, parses
the complete success result, and joins payload kind/source plus acquisition operation, provider,
lease generation and normalized request identity before allocating a result sequence or changing
durable state. The success union now carries an exact immutable objective proposal or literal null.

Consumed replay reparses and rejoins the canonical stored request, settlement and application
receipt on every read, including the retained before/after run revisions and event journal. Batch
replay accepts only its durable batch id and loads the authoritative run image inside the storage
operation. `make pack-capability-fourteenth-author-repair` retains the complete predecessor chain
and passes 6/6 new repair groups. Exact receipt:
`planning/pack-capability-contract/fourteenth-author-repair-2026-09-05.md`. This remains author
evidence; another genuinely fresh review gates acceptance, implementation and the held corpus plan.

## Fifteenth fresh independent return (2026-09-05)

The fresh pass returns the repair on [[D2771]], [[D2772]], [[D2773]], [[D2774]], [[D2775]],
[[D2776]] and [[D2777]]. Every operation selects a different
hand-picked subset of `evidence_jobs`; no closed state-specific parser proves which lease, retry,
result, clock and receipt fields are required or forbidden. A consumed row therefore replays after
its result sequence and terminal clocks are erased and a lease is resurrected. A lease expired in
2000 also loads and settles because expiry is never selected or compared with an observed clock.

The claimed complete provider result remains a structural caller object. Arbitrary `values`, a
crossed actual identity, attacker endpoint and unrelated response digest settle as
`engine_validated`; the digest is not tied to response bytes or a sealed provider delivery. An
objective request from `active` accepts a `failed`→`achieved` proposal plus an unrelated evidence
reference because the join checks only that the expected reference occurs somewhere in the list.

Finally, the receipt is joined only to the mutable current image: rewriting both the run revision
and receipt from 4→5 to 899→900 passes replay without a retained before-image. Settlement and
consumption persist the literal word `now`, so their clocks establish no ordering or lease
validity. `make pack-capability-fifteenth-fresh-review` retains the complete predecessor chain and
passes 6/6 executable falsifier groups. Exact receipt:
`planning/pack-capability-contract/fifteenth-fresh-independent-buildability-review-2026-09-05.md`.
One bounded author repair must compose the real provider-exchange authority, an exhaustive durable
row parser, internally observed clock and immutable transition journal before another fresh review.

## Fifteenth author repair (2026-09-05)

The bounded repair closes [[D2771]], [[D2772]], [[D2773]], [[D2774]], [[D2775]], [[D2776]],
[[D2777]] and self-audit [[D2778]] at contract tier. A single exact parser now consumes all 23
durable job columns and enforces mutually exclusive admitted, running, retry, settled, cancelled and
consumed shapes on every load. Lease acquisition and settlement read the database clock, reject
expired or changed expiry, and terminal writes persist canonical observed instants rather than a
placeholder.

Provider response bytes are parsed canonically through four kind-specific payload algebras; their
digest, operation, instance, request, generation, exact database-issued lease and stored payload
remain one subject. Structural copies, invalid values and equal rows under another database fail.
An objective proposal must begin at the request's exact state and carry exactly the request's prior
evidence plus this job's evidence reference.

Application now records both parsed run images, their digests, the exact appended event slice and
one whole transition digest before advancing the current image and consuming the job. Response-loss
replay loads that record by job identity and rejoins receipt, both images and the retained current
event slice. Rewriting current image plus receipt no longer invents a historical predecessor.
`make pack-capability-fifteenth-author-repair` retains the complete predecessor chain and passes 8/8
new groups. Exact receipt:
`planning/pack-capability-contract/fifteenth-author-repair-2026-09-05.md`. The provider adapter in
the executable model is explicitly disposable; production remains dependency-blocked on the
accepted provider-exchange authority and another genuinely fresh review.

## Sixteenth fresh independent return (2026-09-05)

The next independent pass returns the durable boundary on [[D2802]], [[D2803]], [[D2804]],
[[D2805]], [[D2806]], [[D2807]] and [[D2808]]. The sealed provider envelope does not join its
payload to request FEN/depth or provider identity, and JSON round-trip equality admits multiple
response byte images. Retry basis is arbitrary JSON; empty/unavailable settlements omit their
required availability/failure authority; and parsed rows can cross origin, consumer and provider
operation.

A provider response timestamped after the exact lease expiry still settles. More fundamentally,
the claimed immutable transition is a mutable SQL row protected only by recomputable hashes: a
coherent rewrite of before/after/current images, revisions, digests, transition and receipt passes
replay. `make pack-capability-sixteenth-fresh-review` retains the complete predecessor chain and
passes 7/7 fresh falsifiers. Exact receipt:
`planning/pack-capability-contract/sixteenth-fresh-independent-buildability-review-2026-09-05.md`.
Production remains unauthorized pending a bounded repair and another genuinely fresh review.

## Sixteenth author repair (2026-09-05)

The bounded repair closes [[D2802]]–[[D2808]] at contract tier. Engine and tablebase payloads now
join their exact stored search/FEN operands and compiled provider instance before sealing and again
at settlement. Raw provider bytes must equal the repository's RFC-8785 canonical image. Retry,
empty and unavailable values parse as closed unions carrying the same exact provider availability
and optional sealed failure receipt, while every durable read re-derives both routing maps.

Provider request/retrieval timestamps must fall inside the exact database-issued lease. The
transition table is now append-only application authority: same-migration SQLite triggers reject
updates and direct deletion while preserving whole-owner cascade deletion, and replay requires
those guards before trusting history. `make pack-capability-sixteenth-author-repair` retains the
complete predecessor chain and passes 7/7 new repair groups. Exact receipt:
`planning/pack-capability-contract/sixteenth-author-repair-2026-09-05.md`. This remains disposable
author evidence; another genuinely fresh review and the accepted provider-exchange dependency both
gate acceptance and production implementation.

## Seventeenth fresh independent return (2026-09-06)

The next independent pass returns the durable provider/job boundary on [[D3002]], [[D3003]],
[[D3004]], [[D3005]], [[D3006]], [[D3007]] and [[D3008]]. The
normative success union names `acquisition`, while the executable parser and writer require
`provider` and reject the declared arm. Provider availability and failure receipts are still
accepted as structural JSON, and the origin-specific provider-off terminal table is not encoded.
Retry parsing validates the stored basis but returns the base parser's substituted `{}` bytes.

A loaded lease may begin provider work after its durable expiry changes. Process-global response
time may place retrieval after the database settlement timestamp, and settlement never rejoins the
child to its parent batch request, digest, ordinal and count. `make
pack-capability-seventeenth-fresh-review` retains the complete predecessor chain and passes 7/7 new
falsifiers. Exact receipt:
`planning/pack-capability-contract/seventeenth-fresh-independent-buildability-review-2026-09-06.md`.
Production remains unauthorized pending a bounded repair, another genuinely fresh review and the
accepted provider-exchange dependency.



---

# Part 2 — changelog entries before the cut


- 2026-09-06 (**seventeenth fresh independent return**): returned the sixteenth repair on
  [[D3002]]–[[D3008]]. Success-field parity, sealed provider authority, origin-terminal closure,
  retained retry bytes, current lease authority, one ordered clock and parent-batch revalidation
  remain open. `make pack-capability-seventeenth-fresh-review` retains the chain and passes 7/7.
- 2026-09-05 (**[[D2802]]–[[D2808]] sixteenth author repair**): joined provider payloads to stored
  requests/provider identities, required shared RFC-8785 bytes, closed retry/unavailable unions and
  routing joins, fenced provider time by lease expiry, and made transition rows append-only under
  SQLite authority. `make pack-capability-sixteenth-author-repair` retains the chain and passes 7/7
  new groups. Fresh review and provider-exchange acceptance still gate implementation.
- 2026-09-05 (**[[D2771]]–[[D2778]] fifteenth author repair**): added one exhaustive durable-state
  parser, database-observed expiry/terminal clocks, canonical provider bytes and kind-specific
  values, exact objective joins, exact lease/request authority, and a retained before/after
  transition record. `make pack-capability-fifteenth-author-repair` retains the full chain and
  passes 8/8 new groups. Fresh review still gates implementation.
- 2026-09-05 (**fifteenth fresh independent return**): returned on [[D2771]]–[[D2777]]. The durable
  row parser is partial; expired leases settle; provider and objective evidence can be forged or
  crossed; consumed replay ignores impossible residue; current image plus receipt can be rewritten
  together; and terminal clocks are literal placeholders. `make
  pack-capability-fifteenth-fresh-review` retains the full chain and reproduces 6/6 groups.
- 2026-09-05 (**[[D2742]]–[[D2747]] fourteenth author repair**): bound run/job leases to one exact
  application database; joined complete provider settlement to the stored leased request; made the
  objective-result arm total; and made consumed/batch replay reload and validate their complete
  durable subjects. `make pack-capability-fourteenth-author-repair` retains the full chain and
  passes 6/6 new controls. Fresh review still gates implementation.
- 2026-09-05 (**thirteenth fresh independent return**): returned on [[D2742]]–[[D2747]]. Lease
  brands are not database-bound; provider settlement is not joined to the leased request; the
  objective-result success arm is missing; consumed replay skips canonical stored values; receipt
  revisions are unbound; and batch replay trusts a caller snapshot. `make
  pack-capability-thirteenth-fresh-review` retains the full chain and reproduces 6/6. No production
  or content byte changed.
- 2026-09-04 (**[[D2587]]–[[D2592]] twelfth author repair**): replaced the caller-mintable receipt
  with one sealed before/after run transaction; recursively parsed/froze objective requests; bound
  stored jobs to a parsed run snapshot; derived all three consumers from origin; and added a
  restart-stable per-run result allocator. `make pack-capability-twelfth-author-repair` retains the
  complete eleventh target and passes 6/6 new controls. Fresh review still gates implementation.
- 2026-09-04 (**eleventh fresh independent return**): returned on [[D2587]]–[[D2592]]. Valid guarded
  run effects are outside the receipt; nested objective values remain mutable/unparsed; receipts and
  node maps lack their run authority; both internal origins fail exact SQL; and result ordering can
  reuse a cleared sequence. `make pack-capability-eleventh-fresh-review` reproduces 6/6. Exact
  report: `planning/pack-capability-contract/eleventh-fresh-independent-buildability-review-2026-09-04.md`.
- 2026-09-04 (**[[D2563]]–[[D2569]] eleventh author repair**): superseded the incomplete strict
  protocol; added branded request parsers plus full storage/value joins, row-level rewind and
  stored-success event receipts; and exercised UUID construction inside the concurrent winner.
  `make pack-capability-eleventh-author-repair` passes six groups plus strict TypeScript. Another
  fresh independent review still gates acceptance and implementation.
- 2026-09-04 (**tenth fresh independent return**): returned on [[D2563]]–[[D2569]]. The retained
  protocol omits the new lease/application receipts; arbitrary request objects can be digested;
  canonical request values are not joined to storage columns; rewind and application models prove
  only partial transitions; and fixed ids bypass the declared UUID authority. Exact report:
  `planning/pack-capability-contract/tenth-fresh-independent-buildability-review-2026-09-04.md`.
  `make pack-capability-tenth-fresh-review` passes 7/7; implementation remains unauthorized.
- 2026-09-02 (**[[D2518]]–[[D2520]] eighth author repair**): added both disjoint HTML shared-token
  branches, the two queued evidence-provider operation ids, three sealed enqueue origins and one
  durable admission/lease/retry/settlement/consumption algebra. Claims a migration position behind
  `longitudinal-store`; consumes provider-health receipts instead of duplicating them. The composed
  author image is 60 HTTP branches / 59 HTTP ids plus 2 worker ids. Author controls pass; fresh
  independent review still gates acceptance and implementation.
- 2026-09-02 (**seventh fresh independent return**): returned on [[D2518]]–[[D2520]] because the
  public HTML Story branch and both worker provider gateways were outside the population, and the
  synchronous effect model could not represent settlement after 202/restart. Exact report:
  `planning/pack-capability-contract/seventh-fresh-independent-review-2026-09-02.md`.
- 2026-09-01 (**[[D2429]]–[[D2431]] sixth author repair**): split creation into sealed pack,
  position and imported source arms; replaced the unjoined dotted/snake-case inventories with one
  generated 35-operation/32-route-row method+route+body-branch authority; and added the safe closed
  availability class to the public row so transient reachability is structurally checkable.
  `make pack-capability-sixth-author-repair` passes three executable arms and strict TypeScript;
  the cumulative prior author contract remains green. No production/schema/API/client/corpus byte
  changed; fresh independent review and [[D560]] remain.
- 2026-08-31 (**fifth fresh independent return**): returned on [[D2429]]–[[D2431]]. Pack-less
  creation has no operation-binding arm; the closed operation union and no-provider route actions
  use unjoined identities; and the public parser lacks the deployment mode needed to reject an
  impossible transient row. Exact review:
  `planning/pack-capability-contract/fifth-fresh-independent-review-2026-08-31.md`.
- 2026-08-31 (**D2334–D2339 fifth author repair**): materialized and recomputed the 92-row legacy
  manifest; split pre/post-D560 gates; structured all unconditional selectors; unified and compiled
  declaration history; closed the public projection; and replaced caller requirement lists with an
  internally derived operation census. `make pack-capability-author-repair` passes the cumulative
  artifact contract, 6/6 new arms and TypeScript. No implementation/corpus bytes changed; fifth
  fresh review and D560 remain.
- 2026-08-30 (**fourth fresh independent return**): returned on [[D2334]]–[[D2339]]. The exact
  legacy allowlist has no rows or recomputation; software-first and all-stamped gates conflict;
  unconditional rows omit structured versions; history fixtures use a different type from the RFC;
  `/capabilities` has no closed shared response row; and transient enforcement trusts a
  caller-supplied requirement set. Exact return:
  `planning/pack-capability-contract/fourth-fresh-independent-review-2026-08-30.md`.
  `make pack-capability-fourth-fresh-review` passes 6/6. No implementation is authorised.
- 2026-08-30 (**D2152–D2156 fourth author repair**): replaced the illegal direct 0.27→0.30 patch
  with exact cumulative 0.28/0.29/0.30 stages; published the literal 397-member target inventory
  and checked generator; module-qualified all unconditional, dependency and constant/convention
  sites; admitted lockfile-resolved external semantic sources; and made withdrawal successor versus
  no-successor a typed, planner-visible union. `make pack-capability-author-repair` is the new
  five-arm positive contract. Fresh independent review remains required; no implementation or
  corpus bytes changed.
- 2026-08-30 (**third fresh independent return**): returned on [[D2152]]–[[D2156]]. The sealed
  0.30 target omits the already-owned 0.28/0.29 schema changes; the 373-row applicability authority
  contains no rows or checked generator; fourteen unconditional meaning entries are bare symbols;
  external chess dependencies cannot participate in semantic digests; and withdrawn declarations
  cannot encode their promised successor. Exact return:
  `planning/pack-capability-contract/third-fresh-independent-review-2026-08-30.md`.
  `make pack-capability-third-fresh-review` passes 5/5. No implementation is authorised.
- 2026-08-30 (**D2070–D2076 author repair**): replaced the impossible atomic corpus landing with a
  byte-sealed two-schema transition. Only the exact 92 committed 0.27 catalogue documents may use
  the internal legacy reader; every new/external 0.30 document requires a stamp, and the legacy arm
  retires with the held apply. Split plan validity from apply readiness; published an ordered
  author patch and exact 0.30 post-image; added schema-member plus transitive interpreter meaning
  authority; excluded the complete capability-metadata subtree; made declaration history
  subject+version keyed with one acyclic current chain; and replaced ordinal ids with semantic
  owner/discriminator identities, including the two quantified structural forms. The maintained
  7 + 11 + 6 arms and repaired 7-arm contract pass. Fresh independent review still gates
  acceptance and implementation.
- 2026-08-30 (**second fresh independent return**): returned on [[D2070]]–[[D2076]]. Required
  stamps cannot land apart from the held 92-pack rewrite; judgement-bearing plan output is both
  required red and verify-green; the old raw schema digest cannot survive required annotations and
  `requires`; no author source/dependency closure exists for 373 AST-backed members; capability
  metadata derives capabilities from itself; one declaration per subject cannot retain old+new
  versions; and `oneOf` ordinals make public ids move under semantic no-op reorder. Exact return:
  `planning/pack-capability-contract/second-fresh-independent-review-2026-08-30.md`.
- 2026-08-30 (**D2050–D2055 author repair**): widened the compatibility grammar to shipped
  one-segment ids and made the legacy criterion return `CapabilityVersion`; published the complete
  digest-sealed applicability authority; replaced object annotations with total member arrays;
  named exact transition/opponent sites; moved weakened-Stockfish authority to protected design;
  and replaced finite vocabulary pointers with schema-aware traversal after the repair found the
  recursive-expression under-stamp class. The prior 7 + 11 arms and the repaired 6-arm contract
  pass. Fresh independent review still gates acceptance and implementation.
- 2026-08-30 (**fresh independent return**): returned on [[D2050]]–[[D2054]]. The compatibility
  regex rejects real one-segment shipped ids and criterion 1 contradicts the structured version
  union; the generated applicability authority still has no independent mapping bytes and its
  single-object keyword cannot express per-enum-member mappings; two named evaluator roots remain
  non-symbol prose; and `AGENTS.md` is not a protected-intent authority. Reproduction:
  `make pack-capability-fresh-review`. No schema, pack, registry or product byte changed.
- 2026-08-30 (**second-return author repair**): repaired [[D1982]]–[[D1992]] without implementing
  lane 0.30. Published the exact compatibility id regex and integer/semver version algebra; replaced
  the partial applicability examples with one generated schema/always/reference authority and
  exclusions artifact; gave F1 and resolved content subject-specific source/digest rules; named all
  constant roots; routed both annotations through one strict AJV factory; and canonicalized
  `requires` tuples and bytes. The 20 legacy refusals now have a total identity-keyed migration that
  distinguishes refusal, refutation, unmeasured, pending-decision, unimplemented, withdrawn,
  active and deprecated states. F3's claim-binding seam is compile-time only, leaving all sidecar
  behavior to the downstream RFC after acceptance. `make pack-capability-repeat-review` is now an
  eleven-arm positive author contract. Fresh independent review and the [[D560]] hold remain.
- 2026-08-28 (**seven-blocker independent-return amendment**): [[D1620]]–[[D1622]] now have an
  executable 7-arm disposable falsifier behind `make pack-capability-closure`: literal/absence
  selectors and dependency closure derive exact requirements; AST-token symbol/arm sites catch the
  helper-only D566 change at exact grain; and semantic status cannot alias deployment reachability.
  [[D1623]] gains annotated schema/interpreter roots, literal 13-evaluator/16-table inventories and
  five distinct negative census controls. [[D1624]] is re-derived at `37/193/25/210 core`,
  `67/67/15/1 semantic`, and format `7 reached / 3 refused / 1 retired / 1 unmeasured`.
  [[D1625]] now bans suffix strings only at typed current-authority sites while preserving named
  compatibility fixtures and unrelated artifact-schema ids. [[D1626]] now points F7, evidence-kind
  membership and digest freshness at existing authorities; all seven ledger effects are checked
  Discharges, and the anonymous checkpoint correction landed in the register. Repeat independent
  buildability review remains required; no production or corpus implementation is authorised.
- 2026-08-23 (**six-blocker repair**, post-return): (1) **§3.1 replaces the hand-counted census with
  `make capability-census`, a derivation procedure** over the schema's 52 `$defs`, the tree's
  exhaustive `never` switches, the named evaluators without a vocabulary, and the manifest by
  reference; `CAPABILITY_DECLARATIONS` is asserted **set-equal by id** to its output and the HEAD
  count is baked only as a drift tripwire. This dissolves three blockers together — the four wrong
  arithmetic terms cannot recur because no arithmetic is asserted, the two omitted parent unions
  (`SimpleTrigger` 6, `TransitionExpression` 5) are enumerated by rule, and **`claim.binding` is
  registered** so §4.3's handshake stops refusing every sidecar that names it. (2) **Counts corrected
  at source**: §3a **90**, §3a-ter **62**, conventions **13** (`BREADTH_CONVENTION_TEXT` is 8
  entries), constant tables **16**; primary total **206**. Summary and §2.4 updated to match. (3)
  **§4.2 publishes the supported projection** (that repair's reached/transient formulation), resolving
  the criterion-8/16 contradiction. The repair's copied claim of **5** refused format rows was later
  corrected by the 2026-08-28 amendment to the executable **3**. (4) **§4.4 rewritten onto
  `claim-semantic-anchors` §7's per-binding
  `contract` grammar**; the root-level `requires` form is withdrawn because §7's Stage A keeps a
  legacy binding inside a file the V2 parser also reads, which a per-document declaration cannot
  express; `SIDECAR_CAPABILITY_UNSUPPORTED` is withdrawn so the seam has one refusal code and it is
  the consumer's; the invented *"explicit pinned default"* is struck because §7 refuses an explicit
  `claim.binding@1` in both stages. (5) Criteria **4, 8 and 15** rewritten to match, each naming the
  returned draft's own behaviour as its wrong implementation. §2.5 now states that both vocabularies
  it asserts site-completeness for are declared — the draft asserted criterion 6 against a capability
  criterion 4 forbade.
- 2026-08-23: created, drafted from `planning/platform-alignment/f3-derivation.md` under
  [[D995]]/[[D996]], with the central lane-vs-sidecar fork ruled by [[D1058]].
- 2026-08-23 (scope amendment, pre-review): added **§4.4, the evidence-sidecar declaration**, and
  acceptance criterion 15. **Reason: a cross-document block that acceptance would not have
  cleared.** `rfc/claim-semantic-anchors.md` §7 defers its entire compatibility story to "the
  accepted F3 declaration", and its criterion 7 needs the F3 migration plan to exist as an
  artifact — but the sidecar declaration was **absent from this RFC's derived scope**
  (`f3-derivation.md:798-815`, which never mentions that RFC), so shipping the derived scope
  unchanged would have left `claim-semantic-anchors` blocked **on the day this RFC was accepted**.
  Caught by `planning/platform-alignment/rfc-disposition-packet.md` §3.3 while this draft was still
  in motion. §4.4 also resolves that RFC's conditional claims block to `none` by stating that the
  seam does **not** become a registered resource.
- 2026-08-23 (cross-review): five citation/measurement corrections applied in place; **six
  return-class blockers reported, not fixed** (see the reviewer's report). Corrected here:
  (1) the exploration-gate line cite `o5-o6-handoff.md:100` → `:96` (`:100` is a code fence; the
  `rfc/README.md` Active row carries the same wrong line and is not this reviewer's file to edit);
  (2) §1's quote range `:52-58` → `:54-61` (the drafted range excluded the second quoted paragraph);
  (3) §5.1's *"refuse-to-serve, not degrade"* re-sourced from `docs/drill-client.md:16` — which
  contains no such string anywhere in the file — to `planning/archive/drill-client/log.md:49`;
  (4) §6's *"rubber stamp in a new costume"* cite `graduation-clearance.md:2445-2449` → `:2457-2458`;
  (5) §6's tripwire cite `semantic-evidence-check.ts:25` → `:26` (`:25` is the definition, `:26` the
  assertion); and (6) **criterion 15's sidecar population 32 → 68** — the drafted
  `git ls-files 'content/**/*.evidence.json'` is a filename-convention filter that matches only the
  `content/drafts/` naming and drops all 36 `content/candidates/*/evidence.json` sidecars; 68
  documents carry `schema: "tabiya.sourcing.evidence.v1"` at HEAD, 0 with a `requires` key.
- 2026-08-23 (owner ruling, pre-review): **[[D1077]] reframed and ruled Open question 1.** Added
  **§5.1** (unavailability has exactly two causes — `unsupported` when not configured at startup,
  `temporarily_unavailable` when configured but unreachable, with the owner's completeness argument
  that there is no third cause), rewrote §4.3's refusal paragraph onto it, added acceptance
  criterion 16, and discharged D1. The ruled model reuses the shipped `ProviderOffBehavior` /
  `AvailabilityMode` types and the [[D509]] not-configured-means-not-advertised precedent rather
  than adding parallel machinery. **Gate F clause 5 is unblocked** and needs no further ruling.

