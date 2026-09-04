# Pack capability contract — tenth fresh independent buildability review

- **Date:** 2026-09-04
- **Document:** `rfc/pack-capability-contract.md`
- **Reviewed repair:** [[D2542]]–[[D2547]]
- **Verdict:** returned on [[D2563]]–[[D2569]]
- **Reproducer:** `make pack-capability-tenth-fresh-review` — 7/7

## Scope and method

The review reconstructed the durable evidence-job boundary from the RFC's exact SQL, request
images, strict protocol types, admission authority, concurrent worker, rewind model, application
receipt and criteria 22–27. It crossed each claimed repair with a value the intended authority must
refuse, rather than accepting a prose assertion or a cardinality-only positive.

Every retained author gate remains green. That is not contradictory: the return identifies values
those gates cannot represent or distinguish.

## Findings

### [[D2563]] — the running protocol does not carry the lease receipt

The retained strict TypeScript arm contains only `leaseOwner` and `leaseExpiresAt`. It accepts no
`leaseGeneration` or `jobRequestDigest`, although retry, cancel and settle are specified to require
the exact four-field receipt. SQL can store a generation while service/worker code compiles around
it. The protocol must make the receipt structural and mandatory.

### [[D2564]] — the consumed protocol does not carry the application receipt

The RFC and DDL add `application_receipt_json`, but `EvidenceJobState` still permits a consumed
success with only result, sequence and timestamp. The new receipt is therefore not in the retained
type authority. It must be mandatory on `consumed` and impossible on all other states.

### [[D2565]] — arbitrary values can receive exact request digests

The JavaScript digest helpers canonicalize any JSON-shaped value. They accept a wrong schema
literal and undeclared keys, while the retained admission type uses `[unknown, ...unknown[]]`.
Separate digest domains are useful but do not make the preimages closed. One exact parser must
validate and brand both v1 request forms before any writer or verifier hashes them.

### [[D2566]] — the demonstrated storage join stops at duplicated columns

The composite foreign key correctly rejects a child whose *columns* cross its parent. It does not
bind either row's canonical JSON. The review stores a batch under run A/`explicit_analysis` whose
canonical request says run B/`story_completion`, then stores a run-A child whose request also says
run B; all demonstrated SQL constraints accept it. The parser/transaction contract must set-equal
batch columns, batch request, indexed child columns/request/digest and the immutable run node/FEN.

### [[D2567]] — rewind proves a label, not the required mutation

`rewindState(state)` returns only a destination string. The 8/8 test cannot see the required
running-generation increment and lease clear, the `superseded` cancellation settlement, or exact
preservation of terminal audit bytes. A row-level transition model and negatives for each mutated
field are required.

### [[D2568]] — application receipt validation is not bound to its events

The model checks only that event sequences are non-empty and contiguous. It accepts a backwards
revision pair and an event for another run/node with no evidence reference derived from the job.
The receipt constructor must consume the exact stored success plus run transition, require a
forward revision, and prove the attached/objective events are the job's complete derived output.

### [[D2569]] — the concurrency fixture does not execute UUID construction

Both workers receive fixed `batch-a`/`batch-b` candidates and derive fixed job ids from them. The
test merely reads the adjacent JSON claim that the constructor is `crypto.randomUUID`. Locking and
winner/loser behavior are real; constructor ownership is not. The concurrent admission model must
call the declared constructor only after absence and prove replay performs no new construction.

## What survives

The repair's direction remains sound: a composite parent key, monotone durable lease counter,
domain-separated request digests, `BEGIN IMMEDIATE` winner/loser ordering, a total eight-state
vocabulary and non-empty contiguous application ranges are all retained. None should be weakened.
The eleventh author repair needs to join those pieces into the same typed executable authority.

## Boundary and next action

No production, schema, migration, API, storage, pack, content, digest or protected-design byte is
authorized by this review. Repair [[D2563]]–[[D2569]], retain every earlier control, then obtain
another genuinely fresh independent review before acceptance or implementation. [[D560]] remains
whole.
