# Full 1.0 roadmap — the authoritative product rollup

**Owner:** coordinator · **Rebuilt:** 2026-08-24 under [[D1504]] · **Machine map:**
`planning/roadmap-1.0.json` · **UX-item state:** `planning/work-items-1.0.json` · **Ledger-item
state:** `planning/work-state.json` · **Guards:** `make roadmap-check work-item-check work-state` ·
**Generated status:** `planning/roadmap-1.0.receipt.json`

This is the one strategic answer to “what remains before a full 1.0?”. `design/BACKLOG.md` remains
the idea/defect ledger, `rfc/README.md` the lifecycle/resource register,
`planning/ux-implementation-index.md` the exhaustive UX inventory, and `make work-index` the live
ledger-row-to-destination join. `planning/work-items-1.0.json` is the persistent assignment state
for all 569 UX items. Those are source registers, not competing roadmaps.

The old version said feature work was empty, 39 packs were committed, and no product RFC was
active. HEAD has 46 active product RFCs, zero graduated packs, 569 indexed UX items, and whole
workflows with reducers but no API or web door. The old rows are deleted rather than patched
because their unit was a feature name, not a complete learner journey.

## The verdict

The engineering foundation is substantial. The product is not close to a full 1.0.

What exists is widest below the client: branch/event runtime, schemas and migrations, engines,
identity, evidence contracts, collectors, a large REST handler, authoring services,
classrooms/live primitives, rating arithmetic, and campaign schema/registry/fold. What is
incomplete is the chain that turns them into one coherent product:

`collector → grounded fact → selected module → persisted workflow state → production API →`
`opinionated client journey → official content → release proof`

A capability is not complete because one link exists. That makes the current state honest:

- Campaign is **partial mechanism, missing product**: no persistence, endpoint family, route, or
  authored campaign.
- Review is **partial mechanism, missing full workflow**: not yet the complete grounded game map,
  timeline, explanations, and retry/return loop requested.
- Assistance is **specified foundation, missing ordinary UX**: learners still meet producer labels,
  raw strings, and a 72-control grid instead of useful modules and presets.
- Bots are **measured machinery, missing roster/product**: the production profile catalogue is
  empty.
- Content is **a large draft corpus, zero official product**: no graduated pack, and
  manifest/graduation truth remains release-blocking.
- API breadth was **overstated by REST branch counts**: [[D1532]] found five implemented rating
  families omitted from `application.ts:isApiPath`. They are production-routed now and guarded at
  the real HTTP application boundary; the roadmap retains the distinction for every future family.
- UX is **an architectural rebuild, not polish**: 569 distinct items; 250 queued now, 61 waiting
  on a ruling, 116 on an RFC, 118 done, and 24 stale/wrong. Panels still stack above/between content,
  the board changes size, and evidence leaks as implementation detail.

Run these for current counts; prose counts are dated evidence, not authority:

```sh
make work-index
make work-state
make work-item-check
make status-parity
make register-check
make roadmap-check
make roadmap-progress
```

`make roadmap-receipt` deliberately updates the checked status artefact; ordinary verification
never rewrites it. `make roadmap-check` fails when any joined source changes without the receipt,
so a release/status report cannot silently survive changed milestones, RFC ownership, routes,
API reach or item assignments. `make roadmap-progress` prints the current sealed milestone
checkpoints, strict capability dimensions, RFC lifecycle and persistent UX-work counts without a
hand-copied snapshot.

## What “full” means

Every 1.0 capability is judged on the same eight dimensions. A green code column cannot hide a red
UX, content, or release column.

| Dimension | Required 1.0 proof |
|---|---|
| Evidence | Inputs are grounded, typed, versioned, attributed, able to abstain, and broad enough for the promise. |
| State | Reducers/persistence retain ownership, identity, revisions, resume semantics, and honest absence. |
| API | The production application—not only a direct handler—serves every verb with typed errors and authorization. |
| Experience | A non-technical player completes the journey without internal vocabulary, layout failure, or settings work. |
| Defaults | Named workflows are useful immediately; primitives remain configurable in Advanced, not exposed as the workflow. |
| Content | Reviewed, licensed material exercises every mode and important negative/empty case. |
| Verification | Contract, production-boundary, browser, accessibility, migration, negative, and owner-use checks fail meaningfully. |
| Release | A clean self-host installs, degrades honestly, persists, backs up, restores, upgrades, and rolls back. |

“Core” and “breadth” in the machine map are both 1.0 obligations. Breadth means an integrated
surface, not optional post-1.0 work. Federation, public matchmaking operations, native apps, and
monetization remain outside 1.0 unless promoted; architecture may not make them needlessly
impossible.

## Capability inventory

The machine map is set-equal to the active product RFC register, every UX dossier and stable UX
item id, every client route, and every declared API family. The exact live counts come from
`make roadmap-progress`; they are not copied here. A new active RFC, dossier, item prefix, or route
fails `make roadmap-check` until it has an owner.

### 1. Work truth, measurement, and release accounting

<!-- roadmap-capability: governance -->

**State: complete and ratcheted.** The ledger, RFC register, status parity,
shared-resource register, intent parity and persistent UX-item registry are real. Every generic
ledger row now has one durable state joined to its exact source bytes; terminal rows retain landing
or refusal evidence; live work has an explicit owner or the honest `untriaged`/`unowned` state.
The current six-state census is derived and printed by `make roadmap-progress`; it is never copied
into this prose. The RFC-owned migration classified 870 rows conservatively: draft/awaiting
RFC work is blocked on that exact RFC; accepted/implementing RFC work is todo for its roadmap
capability; nothing becomes doing by inference. Four further source-aware waves assigned every
planning queue, work order, decision record and defect-triage row to its real capability owner.
The one-way ceiling is now zero: a new ownerless live row fails the gate instead of disappearing
into a generic queue.

The 2026-09-04 staged-index regression closes a repository-growth hole in that gate. Once the
append-only exploration log exceeded Node's default 1 MiB child-output buffer, a valid staged append
raised `ENOBUFS` and was falsely reported as a deleted log. Git-object inspection now has an explicit
64 MiB envelope and a permanent committed-plus-staged >1 MiB regression, so the hook distinguishes
real deletion from tool-capacity failure instead of blocking every future checkpoint ([[D2643]]).

**1.0 exit:** coverage stays green; every new live row is assigned at creation; RFC, content,
research and release closeout flows into its register, log, docs, intent proposal, and this rollup;
measurement records retain inputs, revisions, failures and reproducible commands.

Primary RFCs: `measurement-records`, `shared-resource-register-bootstrap`, `work-state`. Debt:
[[D1504]], [[D1505]]; [[D1523]] is discharged for the generic ledger by `make work-state`, while
[[D1528]]'s historical measurement remains the reason the persistent UX registry exists. The
bootstrap RFC owns the product-byte-free absent-root protocol needed before a new versioned shared
resource can be claimed.

Release-engineering follow-up [[D2840]] now adds an executable supersession join between each
hand-authored milestone checkpoint and its named live RFC/work-state anchors. The join hashes the
exact active-register or ledger source row, requires every cited active RFC to be anchored, and
refuses a changed, returned or removed authority even when somebody regenerates the receipt over
unchanged checkpoint prose.

Official-content planning has one owner decision before its next executable migration. [[D2852]]
proves a cycle between Gate F clause 1 and pack schema 0.28: the gate requires no active pack-schema
claim, while the graduation RFC requires the grammar and Gate-F-held corpus migration to land
atomically. The recommended acyclic boundary allows foundation/schema migration before Gate F while
continuing to hold every authored and claim-binding content wave; alternatively the gate must name
an exact excluded migration class. The content hold remains in force until that ruling lands.

The 2026-09-04 sixth bootstrap author repair closes its four bounded predecessor defects, but the
seventh fresh review returns the generic projection engine on [[D2593]]–[[D2597]]. The TypeScript
projector accepts incomplete programs, duplicate nodes and dangling edges; selector admission
accepts invalid paths it cannot resolve while rejecting a valid seed root; shadowed `Object.freeze`
splits static/runtime resource bytes; name matching replaces symbol reachability; and nested
semantics mutate behind fixed digests. `make shared-resource-bootstrap-seventh-fresh-review`
reproduces 5/5. A seventh author repair and another review precede catalogue implementation.

The same-day seventh author repair closes those five seams at the contract boundary: the adapter
constructs and validates its complete graph from the pinned compiler; one parsed selector grammar
serves the ten seed and three follow-on descriptor files; canonical freeze resolves to the global
intrinsic; exact compiler-symbol reach owns retained declarations; and every published semantic
value is recursively copied/frozen before its digest. `make
shared-resource-bootstrap-seventh-author-repair` passes the retained 4/4 plus 5/5 new controls.
Fresh independent review still precedes acceptance and implementation. Receipt:
`planning/shared-resource-register-bootstrap/seventh-author-repair-2026-09-04.md`.

That review has now run and returned the bootstrap again on [[D2645]]–[[D2649]]. The author model
still emits selected nodes with no transitive edges, accepts caller source under fabricated
compiler/config identity, stops at re-export aliases, seals values outside the canonical scalar
domain and cannot represent overload-set roots. `make
shared-resource-bootstrap-eighth-fresh-review` retains nine prior controls and reproduces 5/5 new
blockers. The critical path therefore remains contract repair, not catalogue implementation.
Receipt:
`planning/shared-resource-register-bootstrap/eighth-fresh-independent-buildability-review-2026-09-04.md`.

The same-day eighth author repair closes those five bounded seams without claiming production.
Projection now reads exact committed repository bytes, records the resolved commit plus actual
compiler/config identity, follows typed compiler-symbol edges and aliases, enforces the canonical
scalar domain, and represents overload roots as complete ordered declaration sets. `make
shared-resource-bootstrap-eighth-author-repair` retains fourteen earlier controls and passes 5/5
new repairs. Another genuinely fresh review still precedes acceptance and implementation. Receipt:
`planning/shared-resource-register-bootstrap/eighth-author-repair-2026-09-04.md`.

The ninth fresh independent review returned that repair on [[D2667]]–[[D2672]]. The selected-commit
host still falls back to untracked working-tree bytes, treats mutable `node_modules` as repository
source without a lock identity, embeds machine-absolute TypeScript-library paths, orphans retained
merged declarations, drops property receivers and accepts malformed nested graph ABI. `make
shared-resource-bootstrap-ninth-fresh-review` retains nineteen prior controls and passes 7/7 new
falsifiers. The critical path remains one bounded author repair and another genuinely fresh review;
no production catalogue/register implementation is authorized. Receipt:
`planning/shared-resource-register-bootstrap/ninth-fresh-independent-buildability-review-2026-09-04.md`.

The same-day ninth author repair closes those six boundaries at contract tier. The program host now
refuses repository paths absent from the selected commit, classifies installed packages before
containment and binds them to one committed pnpm-lock identity. External IDs are normalized;
merged declarations and property receivers remain reachable; and the complete nested graph ABI is
recursively asserted. `make shared-resource-bootstrap-ninth-author-repair` retains twenty-six
earlier controls and passes 7/7 repair groups. Another genuinely fresh review still gates
acceptance and production. Receipt:
`planning/shared-resource-register-bootstrap/ninth-author-repair-2026-09-04.md`.

The 2026-09-05 tenth fresh independent review returns that repair on [[D2701]]–[[D2708]]. The
repository-byte closure survives, but committed config still permits duplicate keys and mutable
installed package declarations can move a same-commit projection under an unchanged lock identity.
Graph origin/dependency combinations, unique roots and relation-specific signature arms remain
under-validated; explicit refusals for `any` calls, dynamic imports and broad index lookups do not
execute. `make shared-resource-bootstrap-tenth-fresh-review` retains thirty-three predecessor
controls and passes 8/8 new falsifiers. The foundation critical path remains bounded author repair
and another genuinely fresh review; no catalogue/register implementation is authorized. Receipt:
`planning/shared-resource-register-bootstrap/tenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day tenth author repair closes those eight seams at contract tier. Committed config now
rejects duplicate keys before conversion; exact retained declaration digests make external semantic
bytes part of dependency identity; origin/root/edge invariants are discriminator-exact; and
unresolved calls, dynamic imports and broad index lookups fail closed. `make
shared-resource-bootstrap-tenth-author-repair` retains forty-one predecessor controls and passes
8/8 new repair groups. Another genuinely fresh review still gates acceptance and production.
Receipt: `planning/shared-resource-register-bootstrap/tenth-author-repair-2026-09-05.md`.

The eleventh fresh independent review returns that repair on [[D2795]], [[D2796]], [[D2797]],
[[D2798]], [[D2799]], [[D2800]] and [[D2801]]. External sibling
meaning can still move under a fixed graph and retained identity; `any` property access and global
`eval` publish; constructor and ordinary local-call programs are rejected; and graph assertion
trusts rather than re-derives declaration digests and selected signatures. `make
shared-resource-bootstrap-eleventh-fresh-review` retains forty-nine predecessor controls and passes
7/7 new falsifiers. The foundation critical path remains a bounded eleventh author repair followed
by another fresh review; no catalogue/register implementation is authorized. Receipt:
`planning/shared-resource-register-bootstrap/eleventh-fresh-independent-buildability-review-2026-09-05.md`.

The same-day eleventh author repair closes those seven bounded seams. Non-repository declarations
now carry complete importer-visible declaration-artifact identity; property access and global
`eval` fail closed; constructor and ordinary local-call graphs are representable; and only the
exact compiler-projector-issued sealed graph crosses assertion. `make
shared-resource-bootstrap-eleventh-author-repair` retains fifty-six predecessor controls and passes
7/7 new repair groups. Another genuinely fresh review still gates acceptance and production.
Receipt: `planning/shared-resource-register-bootstrap/eleventh-author-repair-2026-09-05.md`.

The twelfth fresh independent review returns that repair on [[D2828]]–[[D2834]]. Relation checks
identify only a containing declaration and spelling, allowing one valid property edge to mask an
unresolved sibling site and an alias to hide global `eval`. Construct-signature interfaces lose
overloads while nested constructors are attached to the wrong call; incompatible caller descriptors
are sealed; and locale collation enters both graph and dependency-artifact identity. `make
shared-resource-bootstrap-twelfth-fresh-review` retains the predecessor chain and passes seven new
falsifiers plus one direct unresolved-call control. The foundation critical path remains a bounded
site-identity repair and another fresh review; implementation is unauthorized. Receipt:
`planning/shared-resource-register-bootstrap/twelfth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day twelfth author repair closes those seven bounded seams. Compiler relations retain
exact syntax-site paths; global `eval` is refused through value/signature authority; construct
overloads come from the exact call kind; only catalogue-issued descriptors enter projection; and a
single canonical byte comparator owns graph and artifact ordering. `make
shared-resource-bootstrap-twelfth-author-repair` retains the predecessor chain and passes 10/10
repair/self-audit groups. Another genuinely fresh review still gates acceptance and production.
Receipt: `planning/shared-resource-register-bootstrap/twelfth-author-repair-2026-09-05.md`.

The thirteenth fresh independent review returns that repair on [[D2843]]–[[D2845]]. Literal bracket
access is admitted while its exact property declaration disappears; Unicode fixtures prove graph
sets do not execute the claimed UTF-8 comparator and expose the RFC's conflicting UTF-16 authority;
and catalogue admission accepts Unicode identifiers the projector refuses. `make
shared-resource-bootstrap-thirteenth-fresh-review` retains the complete chain and passes 3/3 new
falsifiers. The critical path remains a bounded author repair and another genuinely fresh review;
catalogue/register implementation is unauthorized. Receipt:
`planning/shared-resource-register-bootstrap/thirteenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day thirteenth author repair closes those three seams without narrowing valid TypeScript.
Literal bracket access retains the exact property/site; the existing shared UTF-16 order now owns
every graph and artifact set; and one Unicode-aware parser runs before descriptor issuance and at
projection. `make shared-resource-bootstrap-thirteenth-author-repair` retains the complete chain
and passes 3/3 non-ASCII/literal-access controls. Another genuinely fresh review still gates
acceptance and production. Receipt:
`planning/shared-resource-register-bootstrap/thirteenth-author-repair-2026-09-05.md`.

The fourteenth fresh independent review returns that repair on [[D2854]]–[[D2856]] after executing
the literal follow-on catalogue rather than another invented profile. Four of eight assistance
roots and two of ten workflow-preference roots cannot project: checked record reads lack exact
property targets, a finite-union lookup is rejected as broad indexing, and optional interface calls
lose their overload set. `make shared-resource-bootstrap-fourteenth-fresh-review` retains the
complete predecessor chain and passes 3/3 minimal committed-program falsifiers. The next bounded
repair must make the two real descriptor candidates permanent positives without weakening open
index refusal; catalogue/register implementation remains unauthorized. Receipt:
`planning/shared-resource-register-bootstrap/fourteenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day fourteenth author repair closes those three seams at contract tier. Statically named
reads through a declared index signature retain their exact receiver/index authority; finite
literal-key unions enumerate every exact target while open keys still fail; and optional calls
retain the compiler-selected non-null overload set. The decisive control projects both literal
assistance follow-on descriptors at committed HEAD. `make
shared-resource-bootstrap-fourteenth-author-repair` retains the complete chain and passes 4/4
repair groups. Another genuinely fresh review still gates acceptance and production. Receipt:
`planning/shared-resource-register-bootstrap/fourteenth-author-repair-2026-09-05.md`.

The same-day twelfth `pack-capability-contract` author repair closes [[D2587]]–[[D2592]] at contract
tier without claiming production. One transaction-owned before/after run result derives the exact
core/objective/recorded-guard journal suffix and receipt; the complete nested objective request is
parsed and recursively immutable; stored batches join a parsed run snapshot; all three origins
derive their consumer inside admission; and `evidence_result_sequences` prevents allocation reuse
after rewind/restart. `make pack-capability-twelfth-author-repair` retains the complete eleventh
target and passes 6/6 new controls. Fresh independent review still precedes every
pack/schema/storage implementation. Receipt:
`planning/pack-capability-contract/twelfth-author-repair-2026-09-04.md`.

The twelfth fresh independent review returns that repair on [[D2673]]–[[D2677]]. Its application
surface still brands caller-supplied guard events, jobs and incomplete success settlements; result
allocation bypasses the required lease/generation/request CAS; and idempotent replay returns stored
children without validating them. `make pack-capability-twelfth-fresh-review` retains the author
chain and passes 6/6 new falsifiers. Pack schema 0.30, its migration and the held corpus remain
unauthorized pending a bounded repair and another fresh review. Receipt:
`planning/pack-capability-contract/twelfth-fresh-independent-buildability-review-2026-09-04.md`.

The same-day thirteenth author repair closes those five transaction seams at contract tier. A
SQLite-backed operation now loads stored job/success/run authority, joins run/node/FEN, invokes the
registered guard internally and commits the run mutation, consumption and receipt atomically.
Settlement composes exact success parsing, lease owner/generation/request CAS, monotone allocation
and lease clearing; both batch and application replay validate persisted bytes before returning.
`make pack-capability-thirteenth-author-repair` retains the full chain and passes 6/6 repair groups.
Another genuinely fresh review still gates acceptance and production. Receipt:
`planning/pack-capability-contract/thirteenth-author-repair-2026-09-04.md`.

The same-day thirteenth fresh independent review returns that repair on [[D2742]]–[[D2747]]. The
transaction model's lease brands cross application databases; settlement accepts a provider result
unrelated to its leased job and cannot represent non-null objective results; consumed replay skips
the canonical request/result; receipt revisions do not bind the retained transition; and batch
replay trusts a caller snapshot instead of durable run truth. `make
pack-capability-thirteenth-fresh-review` retains the full chain and passes 6/6 falsifiers. Pack
schema 0.30, evidence-job migration and the held corpus remain unauthorized pending repair and
another fresh review. Receipt:
`planning/pack-capability-contract/thirteenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day fourteenth author repair closes [[D2742]]–[[D2747]] at contract tier. Database-bound
lease capabilities, complete provider-result/job joins, total objective success and full
request/result/receipt/run replay validation now execute under `make
pack-capability-fourteenth-author-repair`, which retains the complete chain and passes 6/6 new
groups. Pack schema 0.30, evidence-job storage and the held corpus remain unauthorized pending
another genuinely fresh review. Receipt:
`planning/pack-capability-contract/fourteenth-author-repair-2026-09-05.md`.

The same-day fifteenth fresh independent review returns that repair on [[D2771]]–[[D2777]]. No
complete state-specific durable-row parser exists; expired leases settle; structural caller values
and crossed objective proposals become evidence; consumed replay ignores impossible row residue;
the current run plus receipt can be rewritten together; and terminal clocks are the literal `now`.
`make pack-capability-fifteenth-fresh-review` retains the entire chain and passes 6/6 falsifier
groups. Pack schema 0.30, evidence-job storage and the held corpus remain unauthorized pending a
bounded repair and another fresh review. Receipt:
`planning/pack-capability-contract/fifteenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day fifteenth author repair closes [[D2771]]–[[D2778]] at contract tier. One exhaustive
23-column state parser, database-observed lease and terminal clocks, canonical provider response
bytes with four kind-specific payload parsers, exact objective/lease joins and a retained
before/after transition authority now execute under `make pack-capability-fifteenth-author-repair`.
The full predecessor chain and 8/8 new groups pass. Pack schema 0.30, the evidence-job/transition
migration and D560 remain unauthorized pending a genuinely fresh review and accepted provider
exchange. Receipt: `planning/pack-capability-contract/fifteenth-author-repair-2026-09-05.md`.

The sixteenth fresh independent review returns that repair on [[D2802]], [[D2803]], [[D2804]],
[[D2805]], [[D2806]], [[D2807]] and [[D2808]]. Provider payloads can contradict their jobs;
noncanonical bytes, fabricated retry/unavailability arms and crossed durable identities pass;
response time can exceed the lease; and the transition “journal” can be coherently rewritten with
recomputed hashes. `make pack-capability-sixteenth-fresh-review` retains the complete predecessor
chain and passes 7/7 new falsifiers. Pack-schema/storage implementation remains held. Receipt:
`planning/pack-capability-contract/sixteenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day sixteenth author repair closes [[D2802]]–[[D2808]] at contract tier. Exact
request/payload/provider joins, shared RFC-8785 response bytes, closed retry/terminal unions,
re-derived durable routing, lease-bounded provider time and append-only SQLite transition authority
now execute under `make pack-capability-sixteenth-author-repair`; the retained predecessor chain
and 7/7 repair groups pass. Pack-schema/storage implementation remains held pending another fresh
review and accepted provider exchange. Receipt:
`planning/pack-capability-contract/sixteenth-author-repair-2026-09-05.md`.

The 2026-09-06 seventeenth fresh independent review returns that repair on [[D3002]]–[[D3008]].
Normative and executable success fields disagree; provider availability/failure authority remains
structural; origin-specific provider-off effects cross; and retry parsing returns substituted
bytes. Provider work may start after durable expiry changes, process and database clocks can invert
retrieval/settlement, and settlement ignores a rewritten parent batch. `make
pack-capability-seventeenth-fresh-review` retains the chain and passes 7/7 new falsifiers. The
evidence-to-consumer critical path remains one bounded repair, another genuinely fresh review and
accepted provider-exchange authority before production. Receipt:
`planning/pack-capability-contract/seventeenth-fresh-independent-buildability-review-2026-09-06.md`.

The provider-protocol process prerequisite is now freshly returned on [[D2809]]–[[D2814]]. Its
canonical descriptor parses, but the maintained review target is stale, README ownership and the
canonical-resource routing row contradict the generic parent, the normative relation does not
typecheck, and copied-consumer/obligation closure relies on an undefined hook protocol. `make
provider-protocol-second-fresh-review` passes 5/5 falsifier groups. This holds provider exchange and
therefore pack-capability acceptance upstream of product implementation. Receipt:
`planning/provider-protocol-register/second-fresh-independent-buildability-review-2026-09-05.md`.

The bounded second author repair closes [[D2809]]–[[D2814]] at contract tier. Both historical
returns are revision-pinned; the maintained target is verify-owned; README ownership, mapped type
relations and canonical-resource routing now agree with the generic parent; and exact obligation,
consumer and able-to-fail validation has one explicit product-RFC owner instead of a fictional
generic hook. `make provider-protocol-second-author-repair` retains both returns and passes 5/5
repair groups. The process RFC remains draft pending the generic-bootstrap dependency and another
genuinely fresh review; no provider product implementation is authorized. Receipt:
`planning/provider-protocol-register/second-author-repair-2026-09-05.md`.

Provider health is freshly returned again on [[D2815]]–[[D2822]]. The fifth repair's named
checkpoint is a second weaker authority: it cannot represent recovery/cache states, accepts mutable
consumer semantics, has no executable pipeline dependency or lease-renewal path, and its durable
recovery crosses stale ply, retry and policy identities. `make provider-health-sixth-fresh-review`
passes 8/8 attacks and is verify-owned. Both the claim-free runtime checkpoint and lane-0.26 durable
checkpoint remain held pending one coherent repair, another fresh review and provider protocol/
exchange. Receipt:
`planning/provider-health-degradation/sixth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day sixth author repair closes [[D2815]]–[[D2822]] and self-audit [[D2823]]–[[D2827]] at
contract tier. One replacement checkpoint now owns full state/cache derivation, immutable semantic
declarations, executable dependency grammar, renewable generation leases, real LRU behavior and
current-run recovery commands under one transaction. `make provider-health-sixth-author-repair`
retains the 8/8 attacks and passes 13/13 repair groups plus strict TypeScript. Both implementation
checkpoints remain held for another fresh review and provider protocol/exchange. Receipt:
`planning/provider-health-degradation/sixth-author-repair-2026-09-05.md`.

The seventh fresh provider-health review returns that replacement on [[D2846]]–[[D2851]]. The
newest controls pass, but the current model silently drops unknown configuration, omits configured
family/implementation, lets stale or cross-registry snapshots clear leases, cannot establish a
shared 429 block, regresses exact-cache service provenance, keeps every exact pipeline
unconditional/single-stage, and drops the prior outcome/selector/release authorities. `make
provider-health-seventh-fresh-review` retains the chain and passes 6/6 attacks. One composed repair,
not another local patch, is required before review or implementation. Receipt:
`planning/provider-health-degradation/seventh-fresh-independent-buildability-review-2026-09-05.md`.

The same-day seventh author repair composes those missing authorities instead of selecting one
predecessor model. Closed configuration, current registry/group authority, shared Retry-After
backoff, full-grain atomic cache service, outcomes, availability and release now cross one model.
It deletes the unused dependency/condition DAG because `/speech` is a separate operation over
sealed displayed text, not a hidden voice stage. `make provider-health-seventh-author-repair`
retains the chain and passes 6/6 repair groups plus strict TypeScript. Fresh review and provider
protocol/exchange still gate implementation. Receipt:
`planning/provider-health-degradation/seventh-author-repair-2026-09-05.md`.

The eighth fresh independent review returns that composed checkpoint on [[D2857]]–[[D2859]]. A
read-only generation-set check replaces the registry's current snapshot, so operation admission
invalidates the exact snapshot F1 must still read; unknown or inexact settlements clear a live claim
and mutate shared backoff; and a shallow-frozen provider payload keeps mutable descendants beneath
one sealed delivery, response digest and exact-cache identity. `make
provider-health-eighth-fresh-review` retains the complete chain and passes 3/3 consumer-shaped
attacks. Both implementation checkpoints remain held for bounded repair, another fresh review and
provider protocol/exchange. Receipt:
`planning/provider-health-degradation/eighth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day eighth author repair closes the three seams at contract tier. Generation-set
validation derives the current group image without issuing a snapshot; the exact four-arm
settlement parser runs before claim/backoff mutation; and provider payloads are defensively copied,
recursively sealed and bound to a canonical payload digest. `make
provider-health-eighth-author-repair` retains the full chain and passes 9/9 repair groups plus strict
TypeScript. Production remains held for another genuinely fresh review and provider protocol/
exchange. Receipt:
`planning/provider-health-degradation/eighth-author-repair-2026-09-05.md`.

The 2026-09-06 ninth fresh review returns that repair on [[D2869]]–[[D2873]]. Two equal read-only
snapshots cannot coexist; cache application grain is forgeable; unrelated cache traffic invalidates
a live Lichess lease; application settlements bypass the exact parser; and a remote→local change can
reuse a generation and predecessor claim. `make provider-health-ninth-fresh-review` retains the
complete chain and passes 5/5 reproductions. Both implementation checkpoints remain held for one
coherent author repair, another fresh review and provider protocol/exchange. Receipt:
`planning/provider-health-degradation/ninth-fresh-independent-buildability-review-2026-09-06.md`.

The same-day ninth author repair closes all five at contract tier. Snapshot currentness is
owner/revision/current-time-state authority; cache keys and local-domain results are sealed;
backoff leases compare only their exact group image; settlement parsing is exact; and configuration
changes require a distinct generation. `make provider-health-ninth-author-repair` retains the
complete chain and passes 6/6 plus strict TypeScript. Production remains held for another genuinely
fresh review and provider protocol/exchange. Receipt:
`planning/provider-health-degradation/ninth-author-repair-2026-09-06.md`.

The same-day tenth fresh review returns that repair on [[D2912]]–[[D2915]]. Instance-wide cache
inventory is promoted to an exact operation hit without a request/key; release receipts omit the
current monotonic projection that stales their source snapshots; shared Lichess backoff blocks the
coordinator while capability still calls the sibling operation requestable; and issuance versus
validation ordering makes a two-provider receipt reject itself immediately. `make
provider-health-tenth-fresh-review` retains the full chain and passes 4/4 reproductions. Both
implementation checkpoints remain held for one coherent repair, another genuinely fresh review and
provider protocol/exchange. Receipt:
`planning/provider-health-degradation/tenth-fresh-independent-buildability-review-2026-09-06.md`.

The same-day tenth author repair closes those four joins and three adjacent closure findings at
contract tier. Request-free cache inventory is conditional rather than exact; release assertions
revalidate their source snapshot at current monotonic time; one group projection drives admission
and capability; release issue/validation share one byte-sorted generation image; recovery is an
exact arm; every configured group requires a coordinator; and repeated transient failures retain
the 5/15/60-second sequence. `make provider-health-tenth-author-repair` retains the complete chain
and passes 8/8 plus strict TypeScript. Production remains held for another genuinely fresh review
and provider protocol/exchange. Receipt:
`planning/provider-health-degradation/tenth-author-repair-2026-09-06.md`.

The same day's third fresh provider-protocol review returns its second repair on
[[D2874]]–[[D2877]]. The process contract asks a one-selector resource for an unreachable partial
state, names no lawful reader for the prior accepted obligation preimage, closes product-only defects
at process time, and leaves structured endpoint identity without a canonical resource mapping.
`make provider-protocol-third-fresh-review` retains the chain and passes 4/4 reproductions. The
protocol population remains blocked on one coherent author repair, another fresh review, and the
generic bootstrap dependency. Receipt:
`planning/provider-protocol-register/third-fresh-independent-buildability-review-2026-09-06.md`.

The same-day third author repair closes [[D2874]]–[[D2877]] at contract tier and closes [[D2897]],
the live-reading historical-review defect found while executing it. Malformed atomic roots now use
`invalid`; a canonical build-only receipt committed at product-RFC acceptance supplies the pure
product validator's prior preimage; [[D2456]]/[[D2457]] remain open until product D4; and endpoint
identity is the exact structured UCI/HTTPS value already owned by the product map. `make
provider-protocol-third-author-repair` retains the complete chain and passes 4/4 repair groups. The
process population still waits on another genuinely fresh review and the generic bootstrap
dependency. Receipt: `planning/provider-protocol-register/third-author-repair-2026-09-06.md`.

The same-day fourth fresh review returns that repair on [[D2909]]–[[D2911]]: current-HEAD receipt
self-authentication survives an intervening replacement, set equality permits a resource-digest-
changing permutation, and the receipt's schema/domain/output wire image is undefined. `make
provider-protocol-fourth-fresh-review` retains the chain and passes all three reproductions plus the
descriptor positive control. Receipt:
`planning/provider-protocol-register/fourth-fresh-independent-buildability-review-2026-09-06.md`.

The fourth author repair closes those three plus [[D2920]]/[[D2921]] at contract tier. The unique first-parent transition
into accepted status pins an opaque exact receipt authority; receipt and resource share one strict
UTF-8/JCS row order; and one literal schema plus domain-separated lowercase SHA-256 grammar owns the
wire, while the historical review reads the exact `ae7fe5b3` bytes it reviewed. `make
provider-protocol-fourth-author-repair` retains the chain and passes 4/4 direct
inversions. Another genuinely fresh review and the generic bootstrap still gate implementation.
Receipt: `planning/provider-protocol-register/fourth-author-repair-2026-09-06.md`.

### 2. Evidence collection, semantic events, selection, and grounding

<!-- roadmap-capability: evidence -->

**State: deep but incomplete.** The evidence contract/manifest and many structural, tactical,
transition, legality, opening, engine, tablebase, human-model, and explorer primitives exist. The
research found both sharp signals and overwhelming noise. Some families await discharge or draft
contracts; operand retention is incomplete; claim anchoring and pack compatibility are unresolved;
producer-to-selector-to-consumer closure is not yet a release invariant.

The 2026-09-06 thirteenth promotion author repair closes [[D2864]]–[[D2868]] at contract tier. One
application-owned canonical inventory byte snapshot now governs current registry, cached generation
store, durable recorded receipt and collector-result authority; a changed second read fails before
issuance, and empty installed generations fail. `make
semantic-collectors-promotion-thirteenth-author-repair` retains the predecessor/return chain,
passes 5/5 current groups and strict TypeScript under ordinary governance. The evidence spine
remains 12/14 pending another genuinely fresh review and provider/value dependency landing.
Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-thirteenth-author-repair-2026-09-06.md`.

The same-day fourteenth fresh independent review returns that repair on [[D2892]]–[[D2896]]. The
application constructor still turns an arbitrary importer-selected path into installed authority
and reaches the predecessor test-only issuer. Registry publication does not validate the complete
generation population it advertises, and repeated/concurrent registry or first-generation opens
can mint multiple simultaneously current authority lineages. `make
semantic-collectors-promotion-fourteenth-fresh-review` retains the full history and passes 5/5
fresh falsifiers plus strict TypeScript. One bounded author repair, another genuinely fresh review
and provider/value dependency landing remain before the held pair can move 12/14→14/14. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fourteenth-fresh-independent-buildability-review-2026-09-06.md`.

The same-day fourteenth author repair closes [[D2892]]–[[D2896]] at contract tier. Installed
configuration is runtime-sealed and path-free at the product entry point; the model imports no
test issuer or predecessor promotion module; every declared generation validates before registry
publication; and registry/store construction is promise-single-flight with failed-promise eviction.
`make semantic-collectors-promotion-fourteenth-author-repair` retains the entire chain and passes
5/5 repair groups plus strict TypeScript. The spine remains **12/14** pending a fifteenth fresh
review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fourteenth-author-repair-2026-09-06.md`.

Runtime opening identity is now a complete foundation slice: its pinned local artifact, exact
endpoint/path/history projections, typed availability, production API route, and image boundary
ship. Its learner-facing Review, theory, bot, and longitudinal bindings deliberately remain owned
by those capabilities rather than being smuggled in as raw labels.

The 2026-08-31 closure re-run makes the remaining foundation work exact. The declared thirty-family
source basis is 14 landed / 7 version-repair / 9 specified-unlanded. The 193 projections split 93
current-bound / 67 research-only / 33 unbound, and all 67 semantic projections still stop before a
live application operation. Event-level validation reaches 39 positives and 10 semantic negatives;
five non-retired projections have no value route and five routed projections have no production
use. `make foundation-closure-check` joins those independent authorities. This replaces the stale
question "which motif names are missing?" with the release path
source→value→operation→validation→consumer. Receipt:
`design/research/foundation-capability-closure-2026-08-31.md` ([[D2374]]).

The 2026-09-04 fifth evidence-presentation author repair closes its six returned contract seams
and the newly measured Explorer reason mismatch [[D2644]] without claiming product UX. The
attribution digest now covers the whole semantic resource; citations require revision metadata;
terminal absence is operation-derived instead of UI-padded; registered questions lose authority
when copied; one predicate expression owns structure match and witness geometry; and canonical UCI
owns Explorer move identity. `make evidence-presentation-fifth-author-repair` passes 31 assertions
plus lifecycle typecheck. Fresh review, the owner-tier component amendment and shared-resource root
still gate implementation. Receipt:
`planning/platform-alignment/evidence-presentation/fifth-author-repair-2026-09-04.md`.

The same-day sixth held-promotion author repair closes [[D2603]]–[[D2607]] at contract tier. One
maintained target now retains every earlier source/FEN/provider gate; one registered factory and
one sealed total result own the output; category, DTZ, precise DTZ, perspective and FEN come from
the exact recorded/live tablebase source; and executable controls reject altered legal maps and
pawn participants. `make semantic-collectors-promotion-sixth-author-repair` passes 19 retained
assertions, four strict typechecks and 5/5 new controls. The spine remains **12/14**, not 14/14:
seventh fresh review and provider/value dependency landing precede the held pair's production
implementation. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-sixth-author-repair-2026-09-04.md`.

The 2026-09-04 seventh fresh held-promotion review returns that contract on [[D2650]]–[[D2654]].
Its total-result seal accepts mutable nested caller objects; its legal-map and geometry receipts are
minted from the same untrusted arrays they purport to certify; its source bypasses the live parser
and ten-category domain; its executable request/provider ABI is not the RFC ABI; and its advertised
F1 output has no declared-evidence identity or central value receipt. `make
semantic-collectors-promotion-seventh-fresh-review` passes 5/5. The spine remains **12/14** until a
seventh bounded author repair, another fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-seventh-fresh-independent-buildability-review-2026-09-04.md`.

The same-day seventh author repair closes those five seams at contract tier. Exact provider and
geometry-completion arms replace arbitrary result objects; shipped FEN-derived legal/contact
authorities replace caller receipts; the production parser and complete ten-category vocabulary
own tablebase values; the request/invocation match the RFC/provider ABI; and the sole output is
declared F1 evidence with one factory-specific value receipt. `make
semantic-collectors-promotion-seventh-author-repair` retains every earlier gate, passes 5/5 new
groups and strict TypeScript. The spine is still **12/14**: eighth fresh review and dependency
landing precede implementation. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-seventh-author-repair-2026-09-04.md`.

The 2026-09-05 eighth fresh held-promotion review returns that repair on [[D2693]]–[[D2700]]. The
leaf constructors pass, but the executable model omits the total collector transaction and its
recorded-first/provider/legal ordering. Caller-written digests become invocation identity;
provider arms cross request positions or timeouts; recorded truth is caller JSON; provider moves
are not legal-FEN validated; input abstention has no legitimate path; and live evidence uses a local
adapter instead of the shared source factory. `make semantic-collectors-promotion-eighth-fresh-review`
retains the full chain and passes 8/8. The spine remains **12/14** pending bounded author repair,
another fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-eighth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day eighth author repair closes those eight executable seams at contract tier. One total
asynchronous collector owns recorded-first lookup, the scheduler-derived request digest and exact
invocation, cancellation/domain/failure, success-only legal resolution, sealed ledger/live source
creation and reachable input abstention. Provider moves are checked against the exact request FEN,
outside-domain evidence reproduces its piece count, and crossed request/result/source authorities
fail. `make semantic-collectors-promotion-eighth-author-repair` retains every prior promotion gate,
passes 8/8 new behavioral groups and strict TypeScript. The spine remains **12/14** pending ninth
fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-eighth-author-repair-2026-09-05.md`.

The same-day ninth fresh review returns that repair on [[D2748]], [[D2749]], [[D2750]], [[D2751]]
and [[D2752]]. Raw caller JSON can still mint the recorded sourcing-ledger authority; the sealed
recorded lookup and legal resolver cannot construct their declared failure/unavailable arms; and
both recorded and live success can emit exact tablebase evidence for an eight-piece request. `make
semantic-collectors-promotion-ninth-fresh-review` retains the complete chain and passes 5/5 fresh
falsifiers. The spine remains **12/14** pending a bounded ninth author repair, another genuinely
fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-ninth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day ninth author repair closes those five seams at contract tier. A complete immutable
ledger record and exact registered source manifest own recorded evidence through one retained
receipt; sealed lookup and legal dependencies construct storage failure and input abstention; and a
request-derived piece-count boundary runs before any recorded/live exact evidence. `make
semantic-collectors-promotion-ninth-author-repair` retains every prior gate, passes 5/5 new controls
and strict TypeScript. The spine remains **12/14** pending tenth fresh review and provider/value
dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-ninth-author-repair-2026-09-05.md`.

The same-day tenth fresh independent review returns that repair on [[D2765]]–[[D2770]]. The model
cannot ingest the production manifest dialect, while caller JSON can mint its durable snapshot,
registered source, future time/unresolved support authority and dependency failures. A cloned
request also reaches the early outside-domain result without request identity. `make
semantic-collectors-promotion-tenth-fresh-review` retains the full chain and passes 6/6. The spine
remains **12/14** pending a bounded repair that consumes production source/storage authority,
another fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-tenth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day tenth author repair closes those six seams at contract tier. Canonical realpath-bound
artifacts cross the production manifest/ledger/linkage validators and retain exact document,
source, time, support, origin and record identity. Request identity precedes every result, and
observed missing storage/legal artifacts are the only failure/abstention route. `make
semantic-collectors-promotion-tenth-author-repair` retains every prior gate, passes 6/6 new groups
and strict TypeScript. The spine remains **12/14** pending another fresh review and provider/value
dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-tenth-author-repair-2026-09-05.md`.

The same-day eleventh fresh independent review returns that repair on [[D2789]]–[[D2794]]. An
arbitrary caller directory and source id still self-register; the document can be an invalid pack
and its resolved support value can contradict the record FEN; HTTP digest and length are never
checked against retained response bytes; and the legal file is only a status token whose malformed
bytes become benign absence. A predecessor recorded result also passes the current aggregate
assertion without the new durable receipt. `make semantic-collectors-promotion-eleventh-fresh-review`
retains the complete chain and passes 6/6 fresh falsifiers plus strict TypeScript. The spine remains
**12/14** pending an installed-generation authority, full subject/value joins, a current-only result
seal, another fresh review and provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-eleventh-fresh-independent-buildability-review-2026-09-05.md`.

The same-day eleventh author repair closes those six seams at contract tier. An installation
inventory owns immutable named generations; the complete production pack/strict-sourcing checks
and exact pack subject run before admission; support values, retained Syzygy response bytes and
FEN-derived legal maps join one record; honest legal unavailability remains distinct from invalid
evidence; and the current result assertion refuses predecessor-only recorded readings. `make
semantic-collectors-promotion-eleventh-author-repair` retains the full chain, passes 7/7 new groups
and strict TypeScript. The spine remains **12/14** pending a twelfth fresh review and provider/value
dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-eleventh-author-repair-2026-09-05.md`.

The same-day twelfth fresh independent review returns that repair on [[D2835]]–[[D2839]]. The
installation inventory remains caller-created rather than application-owned; the generation
grammar admits undeclared fields; duplicate and orphan legal-map rows are ignored; empty supports
pass by vacuity; and duplicate ledger subjects select truth by array order. `make
semantic-collectors-promotion-twelfth-fresh-review` retains the complete chain and passes 5/5 new
falsifiers plus strict TypeScript. The spine remains **12/14** pending a closed installed-inventory
authority, complete unique declaration/record populations, author repair, another fresh review and
provider/value dependency landing. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-twelfth-fresh-independent-buildability-review-2026-09-05.md`.

**Required breadth:** structures and changes; attacks/defences; hanging, overload, deflection,
clearance, attraction, discovered attack, pins, skewers, forks, trapped pieces and mating nets;
king/castling/promotion state; space/development/files/diagonals/outposts; multi-ply and bounded
reply consequences; avoided moves; opening/theory; engine deltas/PV only where permitted;
Maia/human choice; explorer frequency; Syzygy exactness; availability and uncertainty. A motif name
is published only when its predicate and validation earn it.

**1.0 exit:** every family has appropriate positive, mirrored, hard-negative, counterfactual,
imported and external-labelled validation; events preserve operands, sign, phase, source,
grounding, latency and abstention; selectors compile consumer-specific eligibility and
significance; raw-sentence side channels are gone; modules, bots and Review share the manifest.

Primary RFCs: `pack-capability-contract`, `claim-semantic-anchors`, `tactical-collectors`,
`semantic-collectors`, `foundation-source-identity`, `semantic-validation-authority`, `semantic-convention-register`,
`semantic-convention-provenance`,
`runtime-opening-identity`, `exact-legal-mobility`, `breadth-collectors`, `evidence-move-selector`,
`shared-candidate-evidence-packet`, `bounded-policy-targets`, `bounded-target-policy-composition`,
`recorded-semantic-path`.

The 2026-09-01 semantic-validation fifth author repair closes four authority seams without
pretending the evidence is validated: all proposition sources resolve one subject/case/constraint/
expectation record; collection constraints compare whole arrays; owner chronology is derived from
repository transitions; and duplicate roots/declarations/profiles/verdicts fail before equality.
The remaining D0 is deliberately process-only and visible: the owner, or Claude on an explicit
owner ruling, must create the exact empty protected authority root in a prior commit before fresh
review or Slice A. Receipt:
`planning/semantic-validation-authority/fifth-author-repair-2026-09-01.md`.

The 2026-08-31 fifth fresh module-registration review returns the evidence-to-consumer join on
[[D2432]]–[[D2435]]. The artifact's 117/205 population is honest about being requirements-only, but
its relations do not identify ordered multi-edge tactic operands, candidate root/child/selected
occurrences or signed endpoint roles/cardinalities, and its five upstream invocation symbols have
no owner declarations. Receipt:
`planning/learner-modules/fifth-fresh-independent-buildability-review-2026-08-31.md`.

The 2026-08-31 fifth fresh pack-capability review preserves its exact legacy/staged authorities but
returns the runtime boundary on [[D2429]]–[[D2431]]: pack-less creation has no binding arm, logical
operations and concrete route branches are not joined by one exhaustive identity map, and the
shared public parser lacks the deployment-mode input needed for its transient-state rule. Receipt:
`planning/pack-capability-contract/fifth-fresh-independent-review-2026-08-31.md`.

The 2026-09-01 sixth author repair closes those three seams at contract tier. Pack, position and
imported creation have non-interchangeable sealed sources; one generated 35-operation/32-route-row
method+route+body-branch table owns the operation union, bindings and dispatcher join; and the
public row carries the safe four-member availability class needed to validate transient
reachability without exposing provider configuration. Both cumulative and new author contracts
pass. Fresh independent review still gates acceptance and implementation; [[D560]] still holds the
92-pack apply. Receipt:
`planning/pack-capability-contract/sixth-author-repair-2026-09-01.md`.

The 2026-09-02 sixth fresh review preserves that source/public repair but returns the claimed
operation closure on [[D2509]]–[[D2512]]. Its registration path is not the live Pack Studio route;
the POST/PUT-only population excludes rated/playtest/repertoire creation, provider-bearing GETs,
story evidence enqueue and DELETE share revocation; `run.group` hides two provider-backed body arms
inside `none`; and blanket transient 503 erases the compiled `honest_empty` consumer effect. The
next repair must derive the bounded population from the production router/service call graph rather
than prove a hand-authored table total over itself. Receipt:
`planning/pack-capability-contract/sixth-fresh-independent-review-2026-09-02.md`.

The 2026-09-02 seventh author repair closes those four return seams and the newly measured
[[D2513]] session-source defect at its synchronous contract tier. Its 36-action/48-run-branch image,
four group sources and compiled consumer effects survive review. The seventh fresh independent
review nevertheless returns F3 on [[D2518]]–[[D2520]]: the browser-facing public Story route is
outside the ten external branches; Stockfish/Syzygy calls in the asynchronous evidence worker are
outside the provider census; and request-level 503/empty/fallback effects cannot describe a job
settling after HTTP 202 or restart. An eighth author repair and another fresh review still gate
acceptance and implementation. Receipt:
`planning/pack-capability-contract/seventh-fresh-independent-review-2026-09-02.md`.

The 2026-09-02 eighth author repair closes those three seams at contract tier. One token lookup now
dispatches the two public HTML scopes in a 60-branch HTTP image; two queued provider ids close both
worker gateways and three sealed enqueue origins; and a durable `evidence_jobs` lifecycle separates
admission from leased execution, retry, consumer-specific settlement, restart recovery and atomic
consumption. It claims a migration position behind `longitudinal-store` and consumes the existing
provider-health receipt vocabulary. Fresh independent review still gates acceptance and every
production/storage/schema/API byte. Receipt:
`planning/pack-capability-contract/eighth-author-repair-2026-09-02.md`.

The 2026-09-02 eighth fresh independent review preserves those outer populations but returns F3 on
[[D2524]]–[[D2529]]. The proposed durable row drops objective-upgrade output and cannot represent a
legal no-fresh-failure provider result; automatic enrichment and rewind cancellation remain outside
their run transactions; the 1–16-node analysis request has no atomic batch boundary; and none of the
three enqueue origins has a restart-stable idempotency identity. A ninth author repair must close the
settled-result, transaction, batch and dedupe boundaries before another fresh review. No production,
storage, schema, API or content implementation is authorized. Receipt:
`planning/pack-capability-contract/eighth-fresh-independent-buildability-review-2026-09-02.md`.

The 2026-09-02 ninth author repair closes those six contract defects without implementing F3.
Settled success now retains payload, acquisition and objective proposal value-or-null; provider
unavailability retains exact availability plus only an optional real failure; explicit analysis is
one atomic 1–16-job batch; all three origins have persistent replay identities; and named storage
operations join move/enrichment and rewind/cancellation writes. `make
pack-capability-ninth-author-repair` passes 6/6 plus strict TypeScript. Another genuinely fresh
review still gates acceptance and every production byte. Receipt:
`planning/pack-capability-contract/ninth-author-repair-2026-09-02.md`.

The 2026-09-02 tenth author repair closes the ninth review's six durable-proof defects at contract
tier. Batch/child identity is relational and population-exact; leases carry a monotone generation;
job and batch requests have distinct canonical digest domains; a real two-connection SQLite gate
proves one concurrent admission winner; rewind covers all eight durable states; and consumed jobs
retain an exact revision/event-range/digest receipt. `make pack-capability-tenth-author-repair`
passes 6/6, but another genuinely fresh review still gates acceptance and every production byte.
Receipt: `planning/pack-capability-contract/tenth-author-repair-2026-09-02.md`.

The 2026-09-04 eleventh fresh review preserves the strict state union, outer parser, relational
batch join, complete row rewind and winner-only UUID construction, but returns F3 on
[[D2587]]–[[D2592]]. Its executable model rejects valid `immediate_guard` feedback, accepts mutable
and incomplete nested objective requests, can mint a receipt absent from any run journal, accepts a
foreign-run node map, fails both internal origins in real SQLite and permits result-sequence reuse
after rewind. `make pack-capability-eleventh-fresh-review` passes 6/6. Receipt:
`planning/pack-capability-contract/eleventh-fresh-independent-buildability-review-2026-09-04.md`.

The 2026-08-31 fifth fresh candidate-packet review preserves the repaired single retained legal-
move value graph but returns its acceptance boundary on [[D2428]]: the RFC requires one
`exactLegalMoveMap` call while the production declaration adapter necessarily recomputes the same
authority to validate the payload. The author must either provide one sealed authority-producing
operation or document and measure the honest two-computation contract before implementation.
Receipt: `planning/evidence-foundation-ux/shared-candidate-packet-fifth-fresh-independent-review-2026-08-31.md`.

The 2026-09-01 sixth author repair chooses the single-authority operation and measures why. The
registered `createRulesMobilityReadingLegalMovesV1Evidence` route becomes a FEN factory that owns
one `exactLegalMoveMap` call and returns the
only declared graph the packet may flatten; caller maps are refused. Across six positions the
current compiler-plus-validating-adapter path measured 0.080278 ms/position against a 0.029465 ms
single-authority floor (2.724×). Fresh review still gates implementation and downstream consumer
credit. Receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-sixth-author-repair-2026-09-01.md`.

The 2026-09-04 sixth fresh candidate-packet review preserves that one-factory/one-map repair and
returns the build on [[D2625]]–[[D2627]]: its required value-authority predecessor deletes the
adapter file the packet still claims; request scope can change collector facts while direct and
projected packets share identity; and the retained-weight formula omits legal-map, row, abstention
and collector-outcome graphs introduced by the repaired receipt. The evidence foundation therefore
remains held before implementation rather than turning a cache-order-dependent packet into the
denominator for Support, Review and bots. Receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-sixth-fresh-independent-buildability-review-2026-09-04.md`.

The 2026-09-04 seventh author repair closes those three seams without claiming consumer reach.
`evidence-value-authority` remains the sole factory owner; collector contexts no longer receive
request scope and direct/projected shared evidence must agree; and cache admission now measures the
complete private retained graph with explicit logical-byte and object-count limits. The obsolete
visible-item coefficient supplies historical negative evidence only. Support, Review and bots remain
held until a fresh review accepts this packet and its predecessor lands. Receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-seventh-author-repair-2026-09-04.md`.

The 2026-09-04 fourth fresh bounded-target review preserves explicit reading validation and private
factory containment, but returns [[D2628]]–[[D2630]] before implementation: its imported protocol
image omits most of the normative API, its background service has no permitted call path to the
registry-contained factories, and its threat constructor contradicts the exact no-alias route in
the required value-authority migration. These local target facts therefore remain unavailable to
Support, Review and bots until one complete protocol and call graph survive another review. Receipt:
`planning/bounded-policy-targets/fourth-fresh-independent-buildability-review-2026-09-04.md`.

The same-day fifth author repair closes those three contract seams without prematurely shipping
the collector. The imported protocol module is complete and structurally set-equal to the RFC's
exported names, fields and discriminated arms; one generated package-internal route invoker gives
the background service an executable path while the central registry remains the factories' sole
importer; and the threat source uses only the value-authority route's exact factory symbol. The
local target facts remain held for fresh review and dependency landing. Receipt:
`planning/bounded-policy-targets/fifth-author-repair-2026-09-04.md`.

The 2026-09-04 fresh phase-source-composition review preserves independent opening/phase/endgame/
tablebase slots but returns their shared point/arc on [[D2636]]–[[D2642]]. The draft contradicts
its own root-field guard, cannot prove its full-FEN opening join, bypasses the recorded-path
authority, cannot represent the provider's local outside-domain arm, treats recorded absence as a
caller digest, names no lawful inspector projection and uses a circular endgame-applicability
control. Support, Review, bots and longitudinal analysis therefore still lack one trustworthy
source-retaining phase object. Receipt:
`planning/phase-source-composition/fresh-independent-buildability-review-2026-09-04.md`.

The same-day bounded author repair closes those seven defects at contract tier without pretending
the composer ships. Opening is derived from one retained run occurrence; the arc invokes the sole
run+branch path operation; live tablebase retains the provider's exact union; recorded absence
comes only from a sealed pack/ledger snapshot; the private view no longer claims a web Inspector
handoff; and applicability uses independent declared inputs. Dependency acceptance and another
fresh review still gate implementation. Receipt:
`planning/phase-source-composition/author-repair-2026-09-04.md`.

The 2026-09-01 promotion-pair third fresh review also corrected the candidate repair's initially
invented factory alias ([[D2468]]) and returned only the held semantic projections on
[[D2469]]–[[D2472]]: their outside-domain arm depends on an undeclared legal map; their invocation
has no closed request/source-selection type; invalid authority is mislabeled as abstention; and a
valid no-race result is mislabeled unavailable. The original twelve collectors remain implemented.
Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-third-fresh-independent-buildability-review-2026-09-01.md`.

The 2026-09-02 sixth fresh module-registration review returns that requirements layer on
[[D2505]]–[[D2508]]. The move-quality `anyOf` and requirements-only refusal survive, but four source
ABIs remain undeclared/mis-keyed; eval delta was changed from consecutive same-branch points to
branch-A/B; deflection's check-induced positive arm was deleted; and all 205 null exact operations
lack a named completion owner. Both the five-arm author target and four-arm return target are
green. Receipt:
`planning/learner-modules/sixth-fresh-independent-buildability-review-2026-09-02.md`.

The 2026-09-02 seventh author repair closes those four returns at contract tier without making a
blocked row executable. Recorded/Review ABI absences are named blockers rather than invented
assertions; provider delivery retains its operation-keyed factory; eval delta is consecutive and
same-branch; deflection has bait-capture and check-induced alternatives; and one set-equal
exact-operation compiler owns all 117 projection and 205 pair resolutions. Fresh independent
review still gates acceptance and implementation. Receipt:
`planning/learner-modules/seventh-author-repair-2026-09-02.md`.

The 2026-09-02 seventh fresh review preserves those inner repairs but returns module registration
on [[D2530]]–[[D2535]]. The provider pipeline invokes a type, catalogue gate inputs have no exact
evidence identities, eval delta's outer subject remains cross-branch, deflection's check evidence is
outside its dependency closure, all 205 row pointers omit the `module.` key prefix, and the sole
resolution receipt has no runtime seal. `make module-registration-seventh-fresh-review` passes 6/6;
an eighth author repair and another fresh review gate acceptance and implementation. Receipt:
`planning/learner-modules/seventh-fresh-independent-buildability-review-2026-09-02.md`.

The 2026-09-02 eighth author repair closes those six outer authority defects at contract tier.
Provider acquisition uses the injected application, catalogue inputs are exact and crossed-negative,
eval delta is edge-grained, deflection has literal per-alternative inputs, all 205 row pointers join
their required keys, and the final receipt is runtime-sealed. The repair also records [[D2536]]:
the check-induced deflection detector reads check from FEN while its semantic declaration/emitter
cannot carry check evidence, so that arm remains honestly blocked on `semantic-collectors`. Another
fresh independent review still gates acceptance and implementation. Receipt:
`planning/learner-modules/eighth-author-repair-2026-09-02.md`.

The same checkpoint traced [[D2536]] to the producer and authored its repair without changing
production. `semantic-collectors` now requires two exact deflection derivation members, a sealed
edge-1 check event only for the check-induced arm, deterministic bait-before-check selection and
both recorded-path call sites. `make semantic-collectors-deflection-authority-author-contract`
passes 4/4 plus strict TypeScript; fresh review still gates the existing projection change. Receipt:
`planning/evidence-foundation-ux/deflection-check-authority-author-contract-2026-09-02.md`.

The 2026-09-04 fresh independent review accepts that bounded D2536 amendment for implementation.
It exercised the real runtime-sealed check event and exact edge-one anchor, rejected copied and
crossed values, verified the existing two-member manifest machinery and proved module generation
prefers `derivation.anyOf` over its dependency fallback. `make
semantic-collectors-deflection-authority-fresh-review` passes 5/5 plus strict TypeScript. No
production byte changed in the review checkpoint; the held promotion pair remains independently
returned. Receipt:
`planning/evidence-foundation-ux/deflection-check-authority-fresh-independent-review-2026-09-04.md`.

Implementation rehearsal immediately returned that acceptance on [[D2552]]: the emitter rejects
unnecessary check evidence, but generic path compilers had no shared way to know whether the
payload selected bait-capture or check-induced authority. The bounded author repair publishes one
`deflectionObservedInduction` selector used by detector, emitter and all three call sites, and pins
a real dual-arm line to bait-capture with no supplied check event. `make
semantic-collectors-deflection-source-author-repair` passes 4/4 plus strict TypeScript. Production
is re-held until another fresh review. Receipt:
`planning/evidence-foundation-ux/deflection-check-source-selection-author-repair-2026-09-04.md`.

The next fresh review kept that selector but returned the exact-source authority on [[D2553]]. The
real `Bxa7+ Nxa7 Rxe7` dual-arm line and live event seal work; the exact-source compiler stores only
declared check evidence, which cannot pass the event seal, while invoking the whole tactical
collector would widen its source/cost contract. `make semantic-collectors-deflection-source-fresh-review`
passes 4/4 plus strict TypeScript. A narrow sealed check-event constructor and another fresh review
now gate production. Receipt:
`planning/evidence-foundation-ux/deflection-check-source-fresh-independent-review-2026-09-04.md`.

The bounded D2553 author repair now specifies one narrow sealed `checkSemanticEvent` constructor
shared by tactical and exact-source compilation. Exact-source retains the event for deflection and
projects its evidence for attraction without computing reply breadth or double attacks. `make
semantic-collectors-deflection-seal-author-repair` passes 4/4 plus strict TypeScript. Production
remains held until a fresh review proves narrow/broad event identity and both recorded-path modes.
Receipt: `planning/evidence-foundation-ux/deflection-check-seal-author-repair-2026-09-04.md`.

Fresh review then reproduced that constructor directly from the live manifest/compiler and found its
event id, anchor and operands byte-identical to broad/local tactical compilation on both the `Ra8+`
check-only and `Bxa7+` dual-arm lines. Quiet absence and crossed after-FEN refusal also pass. `make
semantic-collectors-deflection-seal-fresh-review` passes 4/4 plus strict TypeScript. The bounded
D2536/D2552/D2553 implementation is authorized; promotion remains independently held. Receipt:
`planning/evidence-foundation-ux/deflection-check-seal-fresh-independent-review-2026-09-04.md`.

The bounded implementation landed on 2026-09-04. The live catalogue now declares two exact
deflection derivation members; detector, emitter and both recorded-path compilers share one
bait-before-check selector; broad and exact-source compilation share one narrow sealed check-event
constructor. Permanent fixtures exercise check-only and dual-arm lines plus missing, unnecessary,
copied, crossed-edge and wrong-projection refusals. The eager D1930 path still refuses 40/80 plies,
while D1931 proves byte-identical exact-source results at 74.3/144.4/245.2 ms p95 through 80 plies.
This removes module-registration's upstream check-event blocker but does not accept that draft; its
next fresh review must exercise the join. Promotion remains held. Receipt:
`planning/evidence-foundation-ux/deflection-check-authority-implementation-2026-09-04.md`.

The 2026-09-04 eighth fresh module-registration review then exercised that join and returned the
artifact on [[D2557]]. All six eighth-repair boundaries survive, but the execution image and its
green author test still require `blocked_upstream_derivation_authority` for the check projection
D2536 has now shipped. The remaining `awaiting_upstream_occurrence_receipt` is real and stays: the
production recorded-path/module source is still unbuilt. A ninth bounded repair must remove only
the false missing-check layer, bind the live constructor/selector and face another fresh review.
Receipt: `planning/learner-modules/eighth-fresh-independent-buildability-review-2026-09-04.md`.

The ninth author repair closes [[D2557]] without laundering the wider dependency. The generated
deflection row now names the live check projection, induction selector, sealed event constructor and
emitter as implemented derivation authority. Its separate `recordedSemanticPath(run, branchId)`
operation remains `awaiting_upstream_occurrence_receipt`, every binding remains dependency-blocked
and final emission is still refused. `make module-registration-ninth-author-repair` passes retained
11/11 + 6/6 + 2/2; another genuinely fresh review gates acceptance. Receipt:
`planning/learner-modules/ninth-author-repair-2026-09-04.md`.

The tenth fresh module-registration review preserves that bounded check repair and returns the
wider evidence join on [[D2584]]–[[D2586]]. Three exact tactic windows call a position-zero duty
reading edge-grained; Postcommit Nudge and Review Map point committed moments at a candidate view
whose selector forbids committed edges; and the live observed-tactic emitter accepts correctly
sealed move/duty/capture/exchange inputs crossed from another legal line. `make
module-registration-tenth-fresh-review` reproduces all three, including the runtime splice. A
bounded tenth author repair and another fresh review still precede acceptance or implementation.
Receipt: `planning/learner-modules/tenth-fresh-independent-buildability-review-2026-09-04.md`.

The bounded tenth author repair closes [[D2584]]–[[D2586]] without activating a module. Exact
ordered-window bindings now retain position/edge offsets and roles; each module timing chooses a
candidate occurrence before commitment or a recorded occurrence afterward; and the live observed
tactic emitters reject each independently crossed move, duty, capture and exchange input. `make
module-registration-tenth-author-repair` passes the maintained 11/11 contract plus 3/3 new
controls. The 117/205 images remain requirements-only and another genuinely fresh review still
gates acceptance. Receipt: `planning/learner-modules/tenth-author-repair-2026-09-04.md`.

The 2026-09-02 fourth fresh promotion-collector review keeps the two held projections out of the
foundation on [[D2521]], [[D2522]] and [[D2523]]. Its advertised closed request uses two undefined types, the
injected Syzygy callable matches no provider operation and leaves normalized request bytes
undetermined, and forgeable completed geometry can suppress every source on the zero-call path.
The original twelve semantic collectors remain implemented; only the held pair is returned.
Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fourth-fresh-independent-buildability-review-2026-09-02.md`.

The 2026-09-02 fourth author repair closes those three promotion returns at contract tier. The
request now has a strict canonical-FEN parser and total recorded lookup; the live arm uses the
actual shared scheduler and operation-keyed source factory over fixed Syzygy request bytes; and
both the derivation receipt and aggregate completed geometry are sealed before the no-output fast
path. Fifth fresh independent review still gates acceptance and implementation. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fourth-author-repair-2026-09-02.md`.

The 2026-09-02 fifth fresh promotion review preserves that source repair but returns the event
boundary on [[D2548]]–[[D2551]]. The outside-domain same-FEN join cannot construct its promised
request digest; the output ABI contains an undefined move type and collapses exact pawn identity;
the sealed value omits geometry/source operands required by the runtime compiler; and the
position-only request has no authoritative semantic-event occurrence. `make
semantic-collectors-promotion-fifth-fresh-review` passes 4/4. The twelve implemented Wave-C
projections remain unchanged; only the held pair awaits a fifth author repair and sixth review.
Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fifth-fresh-independent-buildability-review-2026-09-02.md`.

The 2026-09-04 fifth author repair closes [[D2548]]–[[D2551]] at contract tier without fabricating
a move occurrence. One scheduler-owned operation computes the exact normalized request digest used
by provider results; the promotion value preserves exact legal-move underpromotions, tied pawn
identities, geometry and whole source; and the tablebase result is correctly a position reading,
not an event. [[D2558]] refreshes earlier positive gates that had coupled themselves to obsolete
wording and the old event discriminator. All five author generations pass together, but projections
13–14 remain unimplemented until a sixth genuinely fresh review and their provider/value-authority
dependencies land. Receipt:
`planning/evidence-foundation-ux/semantic-collectors-promotion-fifth-author-repair-2026-09-04.md`.

The 2026-08-28 shared-candidate packet author repair records the owner's foundation-first sequence
without laundering verification into product reach: the provider-free complete population may
land with zero product consumers, while Support/Review/bot discharges remain open. The draft now
specifies a runtime `WeakMap` receipt authority, exact projection reminting, cooperative
collector-group cancellation and literal convention/version/reason types. Fresh independent review
still gates implementation; implementing the packet alone cannot satisfy any 1.0 end feature.
Receipt: `planning/evidence-foundation-ux/shared-candidate-packet-second-repeat-author-repair-2026-08-28.md`.

The 2026-08-28 final independent packet review keeps that foundation unimplemented on five exact
boundaries: no closed service success/cancellation/failure algebra ([[D1977]]); held provider join
behavior still required by foundation acceptance ([[D1978]]); no named production macrotask-yield
adapter ([[D1979]]); a projector type that admits impossible crossed narrow scopes ([[D1980]]); and
the shipped loose-piece wrapper erasing declared unavailability as no event ([[D1981]]). These are
shared correctness dependencies for Support, Review, drills and bots, not optional UX polish.
Receipt: `planning/evidence-foundation-ux/shared-candidate-packet-final-independent-review-2026-08-28.md`.

The 2026-08-28 second repeat review keeps `bounded-policy-targets` unimplemented while preserving
its useful exact-target census and the local/provider/policy split. Seven finite repairs remain:
one exported threat-pass anchor; no invented initial promotion provenance; removal of the
unreachable `target_captured` branch; a discriminated witness algebra; request→result correlation;
a source-position batch that can actually enforce 512 target×candidate pairs; and a bounded
cooperative background queue with cancellation during work. Exact return:
`planning/bounded-policy-targets/second-repeat-independent-buildability-review-2026-08-28.md`.

The 2026-08-28 author repair answers that return without claiming acceptance: one pass-anchor
authority, observation-only promotion tracking, reachable immediate states, a discriminated
bounded-return outcome, one complete-set batch and a bounded cooperative queue are now literal in
the RFC. The author target crosses malformed result states, the 512 admission edge and cancellation
after work begins. A fresh independent buildability review still gates implementation; provider and
policy composition remain separate required 1.0 layers. Receipt:
`planning/bounded-policy-targets/second-repeat-author-repair-2026-08-28.md`.

The convention foundation now has an explicit two-step landing boundary. The process-only
`semantic-convention-register` first records an empty landed set plus D1722's exact 39-member live
claim; only the independently accepted product RFC may then create the runtime declarations and
convert those claims to landed rows. This preserves the no-implementation-before-acceptance law
without leaving a new shared semantic authority outside drift/collision checks.

The 2026-08-28 repeat review keeps that process boundary unimplemented on six exact seams. Because
assistance lands first, semantic conventions are resource nine ([[D2013]]); snapshot C10 cannot
prove the prior 39-member claimant ([[D2014]]); the literal AST reader conflicts with the product's
JSON-expanded declaration source ([[D2015]]); append-only history has no named artifact/check
([[D2016]]); decimal versions exceed safe-number identity ([[D2017]]); and the seed/live-claim rule
is not separated into pre- and post-landing phases ([[D2018]]). The 39-member census and base-id
lineage remain valid; repair must reuse the transition-safe assistance primitive rather than create
another snapshot-only register.

The 2026-08-28 author repair closes those specification gaps without implementing product bytes.
C10 now consumes the C9 transition model, versions are canonical safe integers, and the initial
seed has explicit pre/post-landing invariants. One checked generator binds the reviewed 39-row JSON
to the literal runtime array; canonical JSONL history has a named checker and stable Make/CI
surfaces. Reconciliation found [[D2019]]: an atomic history row cannot contain its own Git commit
hash, so the row carries ref/semantic/registry/owner while Git transition history supplies the
introducing commit. Seven author arms plus 19 prior contracts pass; fresh independent review still
gates both process and product implementation.

The 2026-08-28 second repeat review keeps the shared candidate denominator explicitly
unimplemented. Its neutral complete-legal packet, original constituent evidence, removal of the
false F1 aggregate and one-root bot table all survive. The author repair did not establish a real
first consumer: `semantic-evidence-check.ts` is a verify-only hard-coded command, and the RFC itself
excludes governance tools from production counts. The remaining buildability work is finite:
publish the runtime receipt constructor/projector/assertion rather than an erased type brand; choose
a worker or cooperative-yield execution model before promising cancellation of the measured
synchronous compilation; close convention/version/abstention types; and bind the landing to an
actual Support, Review or bot operation (or obtain an explicit ruling for an intentionally unused
foundation primitive). Provider acceptance still gates only the held bot join. Exact return:
`planning/evidence-foundation-ux/shared-candidate-packet-second-repeat-review-2026-08-28.md`.

The 2026-08-26 independent review keeps [[D1023]]'s measured exact-target collector but returns
`bounded-policy-targets` on [[D1652]]–[[D1658]]. The provider layer must expose reusable node-free
Stockfish and Maia source receipts, literal F1 derivations over sealed target inputs, independent
legal-root completeness, real server operations and bounded scheduling/cache identity. A provider
file or inspector disposition alone does not complete this foundation; Support, Review, bots and
packs may not consume target-policy facts until the amended contract passes repeat review.

The 2026-08-26 contract closure makes the repair executable and changes its unit of work. Exact
target derivation, shared provider exchange receipts and target-policy composition are three
dependency layers; all remain required for 1.0, but they must not be accepted as one partially real
RFC. Nine Node-24 falsifiers prove canonical legal-set equality (including rook-square castling
identity), exact Maia history/request keys, sealed threat/exchange joins, weakest-input confidence,
inherited provider latency, same-exchange engine generation and bounded cancellation. The shared
provider layer is a prerequisite for Review, candidate scoring and evidence-aware bots rather than
private infrastructure owned by this one target family.

The 2026-08-27 author pass now makes that boundary literal. `bounded-policy-targets` is the local
three-projection operation only: it retains sealed threat/exchange/legal-move evidence and owns no
provider bytes. `provider-exchange-and-execution` owns the generic Stockfish/Maia receipts and shared
scheduler. New `bounded-target-policy-composition` owns the two reported provider joins and one
reachable application operation. This is a landing split, not a scope cut: all three are 1.0
requirements, every learner binding remains downstream, and each draft requires independent review
before dependency-ordered acceptance or implementation.

The 2026-08-28 third independent provider review keeps that dependency order but returns the shared
boundary on [[D2000]]–[[D2008]]. The remaining work is not consumer polish: operation/result
correlation, operation-keyed receipt construction, coalesced waiter deadlines, true retention
bounds, representable Syzygy domain abstention, consumer-owned Explorer suitability, descriptor-
owned Stockfish commands/final-line reduction and one canonical digest registry. Review, bots,
theory and provider-backed collectors remain blocked from inventing private substitutes until the
nine-arm `make provider-exchange-final-review` contract is repaired and independently accepted.

The 2026-08-29 fourth independent review confirms those nine author repairs but returns the
composed boundary on [[D2032]]–[[D2034]]. A local Syzygy domain result cannot carry a provider
acquisition receipt without fabricating an exchange; subject availability has no ownership/role or
operation/projection access matrix; and projection-only unique source leaves erase multiplicity
when one consumer needs the same provider at two exact positions. The repair must make source
occurrences and request subjects first-class before provider-backed Review, bots, theory or
collectors can claim complete availability. `make provider-exchange-fourth-review` is the current
three-arm reproduction; implementation remains blocked pending author repair and fresh review.

The same-day author repair now closes those three reproductions plus two self-review failures at the
contract tier. Provider leaves retain occurrence and server-resolved exact subjects; the public
availability route is bounded, run-authorized and deliberately below modules/presets; Syzygy local
domain preflight cannot carry provider provenance; and separate monotonic/wall authorities own
deadlines versus receipts. The fourth target is now a five-arm author contract and the earlier
9 + 7 + 9 targets remain green. This is still not implementation authorization: one fresh
independent review must attack the complete amended bytes first.

The same layer now owns node-free live Syzygy position receipts. [[D1699]] closes Wave C's final
promotion pair: geometry derives from complete declared pawn contacts; outcome joins exact legal
moves to same-FEN recorded-or-live tablebase evidence. [[D1700]] corrects the latency repair itself:
producer-wide metadata cannot describe a producer mixing local geometry with optional-provider
outcome, so F1 must compile availability/latency per projection and derivation member. Six Node-24
arms pass; the semantic RFC needs author amendment/review and the provider dependency before it can
truthfully move 12/14 to 14/14.
The 2026-09-04 sixth fresh review returns the latest held-promotion author repair on
[[D2603]]–[[D2607]]. Its Make target does not run the retained generations it claims; two factory
names compete for one value; the total operation result is unsealed; and the executable model omits
category/DTZ and exact legal-map/FEN/participant joins. `make
semantic-collectors-promotion-sixth-fresh-review` reproduces 5/5. The evidence spine remains 12/14
until one bounded repair, another fresh review and the provider/value dependencies all clear.
The 2026-09-04 seventh fresh review then returns the sixth author repair on [[D2650]]–[[D2654]]:
mutable nested result sources, circular caller-minted receipts, unparsed and incomplete tablebase
values, a shadow request/provider ABI and a plain `{payload}` output leave the promised exact
operation unexercised. `make semantic-collectors-promotion-seventh-fresh-review` reproduces 5/5;
12/14 remains the honest production count.
The seventh author repair then replaces those five shadow seams with exact sealed source/completion
arms, shipped central legal/contact authorities, the production tablebase parser/domain, the
literal request/result ABI and one declared-evidence value receipt. Its maintained target passes
all retained gates plus 5/5 new groups and strict TypeScript. This is still contract evidence:
12/14 remains the honest production count pending eighth fresh review and dependencies.
The same-day eighth fresh candidate-packet review returns its seventh author repair on
[[D2655]]–[[D2660]]. Factory ownership is still asserted against prose rather than the predecessor
source graph; the scope check executes no real dependency-closed plan; retained measurement omits
private wrappers, containers and forbidden own-property shapes; category closure is tautological;
and no bounded cache operation consumes the receipt. `make candidate-packet-eighth-fresh-review`
retains 3/3 + 4/4 earlier controls and passes 6/6 new falsifiers. No packet, cache or consumer is
authorized until one bounded repair closes all six and another genuinely fresh review accepts it.
The bounded eighth author repair now closes those six seams at contract tier. One executable model
imports the predecessor legal-evidence surface, runs all three dependency plans, starts measurement
at one descriptor-closed private aggregate and feeds the resulting byte/object receipt directly to
an entry/byte/object bounded LRU admission operation. `make candidate-packet-eighth-author-repair`
retains every earlier control and passes seven composed arms. Production remains held for another
genuinely fresh review and dependency landing.
The ninth fresh candidate-packet review preserves those bounded controls but returns the composed
surface on [[D2678]]–[[D2684]]. The request is open, packet identity omits five required factual
terms, direct/projected narrow receipts retain different private graphs under one id, cache key and
published wrapper remain caller authority, nested legal values can mutate after admission, and the
thirteen collector rows execute two local placeholders rather than the exact registered adapters.
`make candidate-packet-ninth-fresh-review` retains the complete earlier chain and passes 7/7 new
falsifiers. The packet remains foundation-blocking pending one bounded repair, another fresh review
and dependency landing.
The manifest-wide follow-up makes that F1 amendment exact. The current 46 derived projections carry
96 direct derivation members expanding to 99 executable paths. Eight outputs falsely advertise
local/sync over Stockfish, ten bindings bypass provider-off validation through local wrappers, and
49 immediate members discard reported confidence; the transitive repair touches candidate vector,
story last-level, rank and title. [[D1701]]/[[D1702]] require generated path metadata, sticky
reported confidence and binding-level source-absence semantics before the shared provider layer or
new dependent collectors land. `dependsOn` remains the semantic/migration graph; execution derives
only from literal derivation choices, preserving alternatives rather than conjoining them.
The shared provider boundary now has its fourth source contract. [[D1703]]–[[D1709]] prove the
runtime Explorer page has no position/transport identity, accepts illegal/duplicate/impossible
moves, excludes queue time from its four-second budget, disagrees with its manifest abstentions,
discards fetched response fields and erases valid sub-100 populations. The repair is one node-free
`human.explorer.position_page@1` receipt shared by authoring and interactive policies, followed by
separate theory summary, recorded-move occurrence and repertoire projections. Seven Node-24 arms
pass; the shared provider RFC must cover Stockfish, Maia, Syzygy **and Explorer** before Review,
bots, theory or packs consume new provider evidence.
The variant foundation now has an executable scope receipt rather than the earlier textual count:
[[D1683]] measures 159 production calls across 32 files and separates nine rules-aware play
authorities from 23 standard-only/evidence readers that must be capability-gated. Tier-2 support
must land both halves together; making the branch legal while standard detectors still run is an
evidence-contamination failure, not partial variant support.
[[D1686]] measures the request side of that contamination boundary: run-derived evidence has 15
producer calls, split 8 service / 7 direct REST. A queue guard cannot cover human split, corpus,
voice packets or prediction; the operation population and the rules/setup receipt must be compiled
together. [[D1685]] also blocks prediction independently because its stored Maia mass/rank is not
bound to the active node's position/history.
[[D1688]] now measures the catalogue side across all 37 current producers and three subject
families. Capability must compile three independent axes—source computability, learner admission
and honest-empty versus suppression—before the 193 projection dispositions and 210 bindings are
applied. This is shared foundation, not variant polish: it lets bots consume a legal opponent
provider without widening Support/Review, and prevents derived evidence from laundering an invalid
source into a learner claim.

[[D1710]] closes the missing execution axis and makes the foundation state materially more
negative: 193 compiled projections divide into 93 current-consumer, 67 research-only and 33
unbound, yet the current-admitted candidate vector has zero production callers and **none of the
67 semantic projections reaches a live application operation**. Their exact deepest roots are 45
operator-selector-only, 11 behind the unused candidate helper and 11 isolated sequence helpers.
Phase 3 therefore waits on the complete one-edge packet operation plus the recorded-path compiler;
catalogue membership, an exported constructor or a consumer-operation registry entry cannot
satisfy a module, Review, bot, drill or longitudinal dependency.

The recorded half now has an amended draft owner: `recorded-semantic-path.md` compiles eleven v2
multi-edge projections across thirteen exact 2/3/4/5-edge evaluator rows, with complete window
receipts and a real-consumer completion gate. D1927/D1928/D1932/D1933 now have an executable contract:
total graph-derived paths, path-independent `run.record.edge@1`, and v2 successors rather than an
in-place v1 provenance rewrite, with exact versioned refs replacing the base-id event inventory.
The fixed 20/40/80-ply comparison refuses eager full one-edge
fan-out and resolves [[D1931]] with a byte-identical exact-source shape at
64.7/129.7/212.7 ms p95, all below 500 ms. [[D1921]]/[[D1929]] value/convention identity and repeat
review still block acceptance. [[D1870]] remains the separate consumer/presentation join.

[[D1711]] closes the separate validation axis and makes the word *validated* unavailable at HEAD.
All 67 semantic declarations manufacture their own positive/hard-negative labels, the compiler
checks only non-empty strings, and zero of 134 labels resolves to an independent fixture. The one
external token names an old 33-event R2 input; its output observes 29 current ids and says nothing
about the other 38. A new executable validation authority must run production emitters on genuine
positives and semantic hard negatives, bind exact population result identity and publish total
per-event validation profiles before D1710 wires events into modules. This is not another collector
breadth wave: it makes the existing evidence claims able to fail before their blast radius expands.

[[D1713]] makes that repair estimable: 32/67 events have an emitter positive, 5/67 an emitter
semantic negative and none an emitter-level orientation case. Eleven negatives and four
orientation cases exist only at source-predicate level; counterfactual authority splits 1 emitter,
2 composition and 3 source cases; imported output observes 23 current event roots; external
disagreement covers 8 tactic families; 14 events have no independent authority in any arm. The
validation RFC must close these as classed work packages and a total required/not-applicable table,
not claim one blended coverage percentage.

[[D1714]] refreshes the live migration boundary to 39 valid emitter positives, 10 emitter
negatives, 13 source-only negatives and seven no-valid-authority rows. All fourteen prior empty
rows can mechanically fire, but that does not make them equivalent: five local families are
fixture-ready, two sequences wait on a total recorded-path operation, and seven avoidance families
are defect witnesses because projection/sign aggregation drops their subject. King opposition is
also blocker-blind and opening-live. D1716/D1717 precede validation or learner admission of those
families; green mechanical output is not chess-semantic closure.

[[D1718]] makes the avoidance repair total instead of patching the isolated-pawn witness. Across
the fixed 754 authored + 579 imported decisions, the current top-two selector emits 790 avoidance
facts; 491 played children retain the broad family, 455 retain the exact projected condition key,
and 36 retain the family only on another subject. [[D1719]] separately proves one legal edge can
emit twelve same-family/sign subjects that collapse to one move entry before the receipt is sealed.
The successor therefore needs thirteen declared root-subject/value grammars, subject-first
distinct-move denominators and new `@2` identities upstream of validation and every learner
consumer; filtering the `@1` retained events cannot repair the lost evidence.

[[D1717]] closes the held opposition family's source boundary. The blocker-blind v1 convention
emits 90 observations over the same fixed populations; only 61 have empty intervening squares and
29 are blocked, including every imported occurrence. The authored corpus's all-endgame
concentration is not a source phase rule. New reading/event/avoidance `@2` identities must encode
unobstructed linear geometry, while modules decide endgame relevance. Because eight authored
predicate leaves currently carry no convention version, the author repair also owes an explicit
drill-pack/shape grammar and deliberate content migration before validation or learner admission.

[[D1722]] closes the semantic-provenance question across the whole manifest rather than treating
opposition as an isolated definition bug. Of 42 projections labelled `declared_convention`, only
10 carry a machine-readable convention operand; 16 name a convention only in prose and 16 do
neither. Eighteen additional convention-dependent projections use another scalar grounding. The
compiler accepts same-version meaning rewrites and refuses an added composition convention on a
single-grounding derivation, so validation and modules cannot infer a trustworthy source closure
from today's fields. A compiled convention registry, direct plus per-path transitive refs,
version-enforced migration and sealed bounded disclosure now precede D1711, avoidance v2 and all
learner/provider activation. Ordinary UX still receives module wording; raw ids remain Advanced.

[[D1723]] supplies the first complete convention-to-form case. The broad backward-pawn relation is
worth keeping, but the current 403 file observations erase 404 exact pawn subjects and every
reading has an empty square list. With 153/404 stop squares occupied, the structure fact cannot
honestly become an immediate “advance and be captured” hint. The v2 source therefore retains exact
pawn/stop/support/controller/occupancy identity, while legal advance and legal opponent capture are
separate derived facts. This one primitive can then power a theory-only highlight, a changed-state
card, a direct reply nudge, subject-safe avoidance and bot/style features without any surface
inventing chess meaning. Five authored leaves migrate only after the source contract stabilizes.

[[D1724]] closes the next square-control boundary, with [[D1725]] correcting its initial omission
of shipped work. One `safe` boolean cannot serve current board highlighting, future pawn challenge,
a hypothetical capture-migration closure, a candidate square, an occupied outpost and the value of
using it. The shipped maximal convention leaves zero occupied authored examples; a separately
named same-file convention yields 9 authored / 43 imported while preserving maximal reach for
consumers that truly need it. The broad occupied-control census is a stable 3.17× / 3.23× signal;
the existing minor-only `minor_harassed` event, `harassment_pressure` sequence and D771 local-safety
fact already own important subsets. The successor reuses and binds them through D1710, adding only
missing roles/shared identity, so Support, Review, drills and bots/style consume one family rather
than duplicate it or invent “prevents,” intent or value.

[[D1726]] closes the source-to-ordinary-consumer migration boundary. The web still renders a
median 80–84 legacy structural facts per position and four-to-six transition strings per move;
five inventory families are 85–88% of the structural volume. Eight richer structural sources have
zero consumers and every identity-rich transition successor is research-only. The returned module
draft would even reserve exact mobility, king and material records for Advanced while ordinary
sight keeps their coarse counts. The 1.0 route therefore preserves pack predicates, seals D1727's
named-structure identity, activates D1710 packet/path operations, and makes named modules select
the rich facts. Renaming the raw panel or moving it beside the board does not satisfy this gate.

[[D1728]] closes isolated/doubled pawn subject identity. The existing pawn-connectivity source
reproduces both legacy predicates exactly, but learner/event rows lose exact group membership,
including 27 fixed-population changes whose file truth stays unchanged. The 1.0 route derives
unbounded exact groups and `membership_changed`, preserves current author predicates, and keeps
weakness/value/plan in separate theory/evaluation joins. Ordinary modules, Review, style, bots and
broad content do not activate the file-only rows as learner evidence.

[[D1730]] closes the generic-line-collector question. Nearly a third of raw structural facts are
target-free board-edge blocker rows, while exact target-ray, discovered and observed-clearance
evidence already exists but has no ordinary consumer path. 1.0 versions [[D1731]]'s omitted
equal-count membership changes, keeps the line meanings separate, and lets requested sight,
postcommit Support and Review select exact relations. Another universal “relevant line” detector
would duplicate sources and recreate the dump.

[[D1732]] closes open/half-open file source truth and isolates [[D1733]]: a pawn change can reveal
an eligible file to a stationary rook/queen, a stable 2.43×/3.83× event the moved-piece-only
collector cannot represent. 1.0 derives exact file state from the shared pawn authority, preserves
authored predicates, and exposes moved-entry versus stationary-reveal as separate module/bot/Review
facts. Neither is permitted to manufacture “active,” “controls,” “good” or a plan.

[[D1734]] closes pawn-island event identity. The exact state already ships, but v1's two rows per
move are overwhelmingly no-ops and hide 62 equal-count topology changes as `preserved`; 78 changed
relations affect the non-moving side. 1.0 versions exact partitions, removes unchanged semantic
events, preserves authored count conditions, and supplies module/bot/Review/longitudinal consumers
with the actual affected islands rather than a directionless integer.

### 3. Arrival and the rehearsal loop

<!-- roadmap-capability: rehearsal -->

**State: runtime and stable board shell proven; journey partial.** Commit, consequence, rewind,
fork, compare, replay, resume, leases, pack-optional play, training forms, stable board geometry and
the one-expanded structural companion queue are real. First-run teaching, phase-first catalogue,
module-backed consequence guidance, branch intent, complete compare alignment,
replay-at-another-band, and opinionated entry are not one finished experience.

**1.0 exit:** a new learner experiences the thesis on rails over real content; Just Play,
line/plan/outcome/trajectory, imported and arbitrary-position flows share one stable board and
understandable loop; compare explains same/different, actor, material, convergence, intent and
grounded narrative; terminal states offer correct replay/Review/return doors. Full journeys pass
desktop, tablet, phone, touch, mouse, keyboard, resume and release-image tests.

Primary RFCs: `play-composition`, `pack-training-forms`. UX owners: ARR and CLP items.

### 4. Guided support, theory nudges, prevention, and advanced analysis

<!-- roadmap-capability: support -->

**State: stable composition shipped; evidence-backed ordinary UX missing.** The goal is not rated engine moves. Modules
translate selected evidence at controlled disclosure distance: theory breadcrumb, pattern,
relevant square/piece, threat/defence relation, prevention highlight, or an explicit move only when
the workflow permits. The board/companion shell now provides stable seats, but the eleven typed
modules, preset-driven activation and their honest-empty paths do not yet inhabit them. Raw
engine/Maia/explorer/classifier facts belong in an opt-in inspector.

**1.0 exit:** Quiet, Guided, Support, Drill, Review, Campaign, Academy and Stream open with useful
defaults and promises; module doors name learner questions; one unasked interrupter may claim
attention; theory-only and honest-empty paths are first-class; touch/hover/focus highlights never
resize the board; every primitive remains configurable under Advanced. LLM/TTS are optional
renderers over sealed items, never graders, selectors, chess authorities, or availability gates.

Primary RFCs: `learner-modules`, `module-registration`, `hint-distance`, `assistance-config-register`,
`evidence-presentation`, `intent-presets`. UX owners: INR and SET items.
The 2026-08-26 independent presentation review returns the thirteen-component landing on
[[D1664]]–[[D1672]]. The component vocabulary is still the required layer, but manifest strings
cannot seal typed visual operands; conventions are caller-writable; citation/enum/abstention and
structured-document operands are incomplete; coverage includes non-learner projections; chart
scale is a second visual authority; and real seats/hints plus the owner-tier component amendment
remain unresolved. Presentation implementation starts only after one real projection proves the
admission → sealed adapter → wire/parser → seat → equivalent-sentence path and forged operands fail.
[[D1673]] now proves the adapter/wire/parser portion on one real admitted claim projection with
five positive/negative arms; the remaining work is to generalise through exact per-projection
constructors and the real module route/seat, not to invent a third generic evidence wrapper.
The real module route is now scoped rather than hand-waved: [[D1689]] proves the 36-action run API
has no generic module response, and [[D1690]] proves all five board input modes converge before the
network commit. The returned registration contract needs one timing-discriminated, server-subject
module query and one generation-token staging controller. [[D1691]] also blocks trust: the current
board announces a committed move before the server accepts it; [[D1692]] pins the post-commit nudge
to the learner node returned before automatic opponent play advances the cursor.
The registry's remaining semantic returns now have executable repair shapes: [[D1585]] uses
literal branched answer-content sets rather than a false total ladder; [[D1591]] derives Sight's
`fact + pattern` union from its real 22 projections; [[D1586]] requires a move-free Explorer
population-summary derivation; [[D1587]] reseals reducer survivors through the existing exact
consumer authority; and [[D1589]] keeps the non-guidance rules floor for both Match seats. The
registry remains returned until the RFC absorbs these results and [[D1164]] supplies the exact
stable novelty-identity closure.
That closure is now measured: 52 possible declarations, with active set 49 under the existing
on-request repeat-answer invariant or 52 only if theory breadcrumb becomes suppressible.
[[D1693]] corrects the draft's false `38 + 6 + 4` arithmetic; [[D1694]] keeps the author from
silently choosing timing through an identity table. Production remains blocked on amendment and
repeat review, not further novelty discovery.
The 2026-08-26 independent re-review returns the preset compiler on [[D1659]]–[[D1663]] and
[[D1437]]/[[D1500]]: unset preferences currently masquerade as explicit Quiet choices; raw config
and module outputs can contradict; availability is undefined across provider/browser state;
Campaign is unreachable; and a deferred module consumer cannot discharge activation/logging.
[[D1660]] is the remaining owner rule for named presets versus Custom/Advanced overrides. The
shipped context/preset ids remain foundation, but a pill may not claim a preset until compiled
behavior and its logged module deliveries agree.
The 2026-08-27 module-registry repeat review verifies the original semantic/staging/novelty repair
harnesses, then returns the production join on [[D1863]]–[[D1870]]. Browser-local requested help
cannot be derived by a server that forbids it; the module path still calls the projection-only
string renderer presentation replaces; no operation assembles the 186+R admitted projection
population; revealing pre/at-commit modules have no claimed disclosure boundary; the legacy
`assistance.arrows` consumer would duplicate or bypass modules; the eleven branched capability
sets are unstated; and request chess/rung/checkpoint strings lack authoritative validation. The
subsequent 186-pair execution census also proves the observed
deflection/attraction/clearance/interference/zwischenzug/overload family has no learner-module
consumer even after its separately missing recorded-path compiler lands.
Registration can proceed only as a real request → server clamp → collector execution → exact F1
pair → reducer → sealed component → seat path, not as declarations around an empty input list.
Owner ruling [[D1564]] makes producer coverage part of this exit: the evidence layer owes the
typed operands required by every promised module. Presentation work may abstain honestly while a
source is unavailable, but 1.0 may not defer required emitters behind that availability state.
[[D1568]] separates two coupled obligations: existing directed evidence needs a typed one-fact
relation overlay and applied assistance clamp, while genuinely lossy transition emitters must
retain the missing piece/square identities before their modules can claim closure.
[[D1577]] re-checks the second half against the newer identity-preserving transition-event layer:
legacy count readings may remain lossy pack/inspector compatibility projections while modules use
the event authority, but only if corpus-wide equivalence and rule-event decomposition pass.
That measurement passes on all 754 committed edges: amend the presentation/module drafts around
the shipped event authority. [[D1578]] proves en-passant's victim square already survives in the
admitted capture-class derivation; bind that adapter and refuse endpoint inference from raw capture
rather than inventing another producer.
[[D1569]] keeps the guided-hint producer family literal: its module binding imports the measured
per-family horizon registry only after the selector/redaction gate, never a generic or wildcard
projection that launders different derivations into one id.
The 2026-08-26 rebuild now makes that gate concrete: one operator horizon per measured family,
one learner disclosure per family×rung, physical omission of higher-rung bytes, and one
per-decision Hint/A-little-more interaction. [[D1582]] keeps the F1 trust boundary honest across
REST: admitted views remain server-local and terminate in a closed digest-checked delivery receipt.
The rebuild still awaits independent review and the shared packet. [[D1581]]'s process-only
`assistance-config-register` draft now specifies the missing normalized-shape/head register and
sole v5 claim; it too awaits independent review before implementation. No UX work may substitute
raw engine/PV strings while those dependencies wait.
The 2026-08-28 repeat review keeps the normalized TypeChecker image and [[D1916]] repair, but
returns C9 on [[D2009]]–[[D2012]]: contiguous history and the prior-claim→landing transition are
not enforced, while the proposed claim/status edits contradict Guided Hint's codec and still-open
owner ruling. Assistance v5, presets and the downstream semantic-convention register remain
ordered behind a transition-safe author repair; `make assistance-register-repeat-review` is the
four-arm reproduction.
The 2026-08-28 author repair now specifies that transition rather than treating the finding as
closed by prose: exact pinned v1–v4 history, prefix-only staged/first-parent appends, and one prior
claimant whose exact path/symbol set and RFC identity bind the next Landed row. The v5 claim now
names runtime `parseAssistanceConfig`, and dependent preset status remains honestly blocked on the
D1639 owner ruling. Seven author arms plus the seven original D1916 arms pass; fresh independent
review still gates C9 implementation and the dependent C10 repair.
[[D1570]]–[[D1576]] return the shared candidate packet to buildability research before it becomes
the denominator for bots, hints and Review: bind or demote the packet in F1, retain literal engine
evidence in scored joins, name the execution/cache owner, make cache identities coherent and
memory-bounded, derive the emitter closure from code rather than a sample, and enumerate the
runtime/server symbol migration plus real consumer entry points. The buildability amendment now
specifies those obligations; independent review and the Node-24 latency/heap receipt gate
acceptance. [[D1576]] prevents the engine join from solving provenance with a fake run node: one
generic typed fixed-bound position evaluation feeds both candidate scoring and Review's derived
node-scoped point.
[[D1579]] closes the Node-24 receipt and corrects the cache unit before implementation: an equal
event/reading count admits 91.78 MB mixed heap while the same eight event-only entries retain
52.28 MB. The typed initial weight is therefore `events + 5×readings`; its corrected 56,000-weight
trial retains six mixed stress roots / 67.17 MB and preserves the equal-item arm as a negative
control. [[D1580]] keeps release clearance honest: the ruled core/cpu/accelerated tiers still name no
numeric heap/RSS ceiling, so the packet can be bounded, cross-reviewed and implemented but cannot
claim appliance-tier clearance until F12 supplies the predicate.

### 5. Whole-game Review, story, share, and return

<!-- roadmap-capability: review -->

**State: fragments exist, complete Review does not.** Import, story/share, grades, moments, progress
and retry primitives exist at uneven depths. The current result is neither a strong after-game
understanding surface nor Tabiya's distinctive return-to-rehearsal loop. [[D1536]] closes the known
raw cp/enum leaks; story is still capped to opaque cards, the move/phase arc is missing, and engine
graphics outrank grounded explanation.

The 2026-08-26 compiler checkpoint keeps the typed node-free engine score and separate cp/mate
domains, but returns the production contract on [[D1644]]–[[D1651]]: reusable White-WDL identity,
position-anchored mate proof, the actual Story queue path, same-exchange engine provenance,
learner-side compatibility, the process-local-seal/wire boundary, bounded whole-game scheduling and
weakest-input confidence. Review implementation cannot begin by merely filling the drafted types;
those eight joins are part of the 1.0 foundation.

The 2026-08-28 author amendment repairs those eight joins without reducing Review. [[D1969]] keeps
raw side-to-move WDL on the same fixed-bound Stockfish delivery as the typed score, then Review
normalizes it node-free and creates exact recorded occurrences. Forced-mate v2 binds exact position
endpoints to `run.record.edge@1`; one bounded progressive coordinator replaces both legacy queue
paths; a server-only renderer terminates the sealed packet in a closed parsed receipt; and every
derived engine item remains measured/reported. The amended compiler and its provider dependency
still require fresh independent review and implementation, so this is contract progress rather
than a completed Review claim.

The 2026-09-04 fresh review preserves those evidence corrections but returns the compiler before
implementation on [[D2631]]–[[D2635]]. There is still no callable input or
aggregate packet assertion; mixed progressive/degraded availability is unrepresentable and has no
node-to-prefix fold; the proposed raw-sentence wire conflicts with the sealed component authority;
packet evidence and learner-side story context share no authorized prefix receipt; and exhausted
provider attempts have no bounded owner across LRU eviction. Full Review therefore remains behind
an authority/availability/presentation repair, not merely an implementation queue. Receipt:
`planning/evidence-foundation-ux/review-evidence-compiler-fresh-independent-buildability-review-2026-09-04.md`.

The 2026-09-04 second author repair closes those five specification holes without claiming product
progress. `ReviewEvidenceInput` now binds a compiler-derived recorded-prefix subject to the exact
adapter invocation set; packet construction/assertion owns the aggregate trust boundary; one total
node-to-prefix fold feeds orthogonal progress and degradation; Story/title/public share consume
sealed presentation receipts rather than raw prose; and a fixed-capacity pre-reserved attempt store
survives branch LRU without becoming unbounded. The retained 6/6 controls plus 5/5 new behavioral
falsifiers pass under `make review-evidence-second-author-repair`. Full Review still waits on a fresh
review, dependency implementation and then production code. Receipt:
`planning/evidence-foundation-ux/review-evidence-compiler-second-author-repair-2026-09-04.md`.

The second fresh review returns that repair on [[D2685]]–[[D2692]]. Its aggregate and recorded-
prefix seals are forgeable/mutable in the executable model; anonymous folds cannot prove exact
path-node or closed-family coverage; attempt reservation has no concurrent terminal-result path;
and source-plan/presentation integration is asserted only by matching prose. The review also finds
the advertised second-author target red 4/5 against the live module contract and absent from
ordinary verification. `make review-evidence-second-fresh-review` retains the original six controls
and passes 8/8 new falsifiers. Full Review remains contract-blocked rather than implementation-ready.

The 2026-09-05 third author repair closes those eight executable seams without claiming a Review
surface. Deep prefix and packet authorities reject equal-byte forgeries; exact path-node and closed
nine-family populations drive the folds; concurrent readers share one terminal-result promise;
and the complete source-plan/compiler/assertion plus component→wire→parser→public presentation path
execute with their crossings. The live module execution image carries the callable ABI, and
`verify-governance` retains `make review-evidence-third-author-repair`, so the repaired contract
cannot silently become red outside CI again. Fresh independent review and the named foundation
dependencies still precede acceptance and production. Receipt:
`planning/evidence-foundation-ux/review-evidence-compiler-third-author-repair-2026-09-05.md`.

**1.0 exit:** native, bot, imported, social and campaign games compile to one Review Map: opening
and phase arc; navigable move timeline; bounded grounded moments; separate grade, human rarity,
theory, semantic change and exact endgame facts; correct learner-side result; decided-position
suppression; replay/retry, related drill/theory, share and schedule doors. Avoid both failures: raw
engine dump and uncapped “engine review with rewind”. LLM-off output is complete and share-safe.

Primary RFCs: `move-quality-grades`, `review-map`, `review-evidence-compiler`,
`feedback-delivery`, `return-scheduling`. UX owner: ATR items.

### 6. Theory, library, authoring, content, and graduation

<!-- roadmap-capability: theory_content -->

**State: useful material, zero official release content.** Shapes and principles are reused more
coherently than one-off concepts, but learners cannot browse them as a real knowledge surface.
Authoring services are deeper than the client; Library is a duplicate non-clickable listing;
principles need cited grounding; all 32 manifests measured in [[D1508]] were stale; no pack is
graduated.

**1.0 exit:** licensed/version-pinned theory and evidence ground principles/shapes/claims; the
capability contract and migration planner prevent blind corpus rewrites; Studio, CLI, CI and
graduation run the same checks; authors can browse vocabulary, lint unsaved bytes, preview,
regression-play and publish; learners search by phase/structure/motif/opening/mode/level,
understand, launch the exact drill, and return. A varied pilot graduates before breadth authoring,
then official content covers openings, middlegames, endgames, trajectories, forms, levels,
counter-cases and honest empties. Runtime ships an allow-listed immutable content bundle.

Primary RFCs: `graduation-clearance`, `pack-population-provenance`,
`concept-registry`, `theory-knowledge-pipeline`, `theory-drill-current-joins`, `famous-games`. UX
owner: AUT items.
Owner ruling [[D1563]] funds the authoring board, community-author workflow, Knowledge replacement,
principle provenance and official-content review instrument. The four-door chooser must not ship as
a boardless placeholder; it is now implementation work rather than an owner fork.

The 2026-09-04 concept-registry review confirms that the 199 references across 50 concept-bearing
packs already fit the proposed 168-ID grammar and returned the identity contract on [[D2661]]–
[[D2666]]. The first repair now specifies append-only exact revisions, sealed occurrence-backed
migration with non-grounding quarantine, six live consumers plus two successor discharges, honest
export-only account scope and a GitHub-enrolled governance target. This is contract progress, not a
landed registry: another fresh review and shared-resource bootstrap still gate Campaign, Skills,
related attempts and pack authoring from consuming one global identity.

The 2026-09-05 second fresh review returns that repair on [[D2709]]–[[D2716]]. Revision bytes and
refs remain noncanonical or mutable; arbitrary caller pack JSON and matching plain attempt/run
objects mint the two historical authorities; migration is a row mapper with no atomic lossless
population receipt; and consumer closure trusts a deduplicated string list rather than imports.
`make concept-registry-second-fresh-review` retains 13 prior controls and passes 8/8 new falsifiers.
The global identity foundation remains at contract repair, not implementation. Receipt:
`planning/concept-registry/second-fresh-independent-buildability-review-2026-09-05.md`.

The bounded second author repair now closes those eight requirements gaps without claiming product
implementation. Revisions/refs are canonical and sealed; migration is one storage-owned,
rollback-safe population transaction over stored run/attempt plus installed pack authority with a
lossless restart receipt; and the six-consumer closure is derived from the committed TypeScript
import graph. `make concept-registry-second-author-repair` retains 21 predecessor controls and
passes eight repair groups. The RFC remains draft pending genuinely fresh review and the
shared-resource bootstrap dependency; registry-dependent packs, Campaign and Skills remain blocked
rather than consuming a shadow identity layer.

The 2026-09-06 third fresh review returns that repair on [[D2878]]–[[D2884]]. Its executable
migration targets a nonexistent row id and private run shape, substitutes a reduced projection for
the full pack artifact, reads its population before locking and accepts stale restart state. The
promised head/revision-file compiler is absent; six dead imports satisfy consumer closure; and label
collision is locale lowercasing rather than Unicode case folding. `make
concept-registry-third-fresh-review` retains 29 predecessor controls and passes 7/7 reproductions.
The identity foundation remains at contract repair, not implementation. Receipt:
`planning/concept-registry/third-fresh-independent-buildability-review-2026-09-06.md`.

The bounded third author repair closes those seven requirements gaps without claiming a landed
registry. The migration now executes against the shipped compound storage identity, runtime replay
and exact PackRegistry artifact under one transaction; restart recomputes every authority and both
output populations. The canonical revision-chain compiler, exact historical resolver, six
operation-level TypeScript consumer obligations and a pinned locale-free collision key are
executable. `make concept-registry-third-author-repair` retains the chain and passes 7/7 current
groups plus strict TypeScript. Fresh independent review and the shared-resource bootstrap still
precede acceptance and implementation. Receipt:
`planning/concept-registry/third-author-repair-2026-09-06.md`.

The full verification gate also found [[D2898]]: the third “historical” review reread live RFC,
storage and predecessor source text, so repairing D2884 invalidated its retained falsifier. Those
reviewed text inputs are now pinned to exact commit `da3fde39`, and the successor asserts the pin;
the review/repair chain can be green simultaneously without erasing why the repair exists.

### 7. Human-like bots, personalities, roster, and bot events

<!-- roadmap-capability: bots -->

**State: measured machinery, no production roster.** Maia bands and policy composition exist;
route-source research passed; the catalogue still has no composed production profiles, depth
persistence and trait population block it, and most personality claims are not observable in play.
Avatars or adjectives do not solve that. The 2026-08-26 buildability return adds the deeper
contract blockers: typed shared-probe guard evidence, dependent-trait fallback, compiled trait
identities, a production composer route, combined selection budget and the owner-ruled picker/card/
identity surface ([[D1601]], [[D1602]], [[D1603]], [[D1604]], [[D1605]], [[D1606]], [[D1607]],
[[D1608]], [[D1609]]). The 2026-08-28 repeat review then found the production amendment had not
joined the newer shared foundation: bot play still forked Maia/Stockfish acquisition, confused
mass with legal coverage, duplicated the candidate packet, left the durable record open and could
not make an awaited move atomic/idempotent ([[D1970]], [[D1971]], [[D1972]], [[D1973]], [[D1974]],
[[D1975]], [[D1976]]). [[D1610]] and [[D1611]] retain
the final persona assets and explicit default as owner choices. An honest non-empty catalogue is
downstream of those repairs, not a substitute for them.

The 2026-08-31 third fresh review also prevents a 31-green-test author checkpoint from being
misreported as bot progress. The executable model truncates unnormalized sampler weights, hashes
delivery timestamps into deterministic identity, accepts forged durable decision fields, copies the
provider-health authority and promotes an exact cache entry to global roster availability
([[D2407]]–[[D2411]]). These are operation-integrity blockers, not roster polish. Exact return:
`planning/platform-alignment/bot-policy/third-fresh-independent-buildability-review-2026-08-31.md`.

**1.0 exit:** four measured bands × three behavior families carry immutable policy digests;
grounded route proposals and guard fallback never throw; repertoire, traits, plausible errors,
phase/endgame/clock behavior, rematch/history and declared absences appear on honest cards. Names
may be fun; behavioral claims cite a mechanism or measured rate. Blind human-likeness, strength,
trait observability, severe-loss, latency, reproducibility and provider-off gates pass. Local bot
events create ordinary Reviewable games without claiming public-event operations.

Primary RFCs: `bot-policy`, `bot-roster`, `bot-route-source`. UX owner: OPP items.
Owner ruling [[D1566]] fixes picker placement, persistent persona grain, visible identity,
band-relative honesty and clock-labelled calibration; the drafts still own their mechanisms.

### 8. Rating, longitudinal history, skills, style, and recommendations

<!-- roadmap-capability: learner_model -->

**State: rating partly surfaced; longitudinal spine draft.** Rating arithmetic/storage and a narrow
screen exist. Observation store, actor-complete events, background projection, style, skill
credits, opening performance, drill-down, privacy/sharing and recommendations do not form a
product. [[D1532]] repaired the five rating/marks/standing families at the production boundary;
longitudinal/profile APIs remain absent.

**1.0 exit:** owned immutable events rebuild idempotent observations/aggregates; metrics show
occurrence/opportunity, phase/decision class, revision, uncertainty, examples and abstention;
rating stays isolated from move feedback; style is continuous evidence, not a manufactured type;
skills are credits, not levels; opening/phase trends lead to relevant theory/drills; learners
control privacy, sharing, export and deletion.

Primary RFCs: `longitudinal-store`, `concept-registry`, `player-style`, `learner-rating`, `skills`.

### 9. Campaign, progression, encounters, resources, and failure

<!-- roadmap-capability: campaign -->

**State: reducer without product.** Schema, registry, contracts, validation and fold exist.
Persistence is blocked in the migration chain; failure-resource research is open; endpoints,
client route and authored campaigns are absent. [[D1514]] makes Campaign first-class.

**1.0 exit:** versioned campaigns compose registered packs, bots, modules, skills/rating, variants,
rewards, earned rewinds and a researched consequential-but-non-punitive failure economy; state
survives crash/retry/upgrade; API covers enter/read/seal/fail/reward/spend/unlock/resume/abandon;
web has an accessible map, encounter prep, in-run context, results, inventory and Review/return.
One varied campaign is authored and replayed end-to-end. Library remains open; progression is never
sold.

Primary RFCs: `campaign-core`, `concept-registry`, `campaign-boss-games`,
`campaign-catalogue-progression`, `training-mode-variants`. UX owner: CMP items.
Owner ruling [[D1565]] requires two explicit progression horizons: a run-scoped inventory of
drip-fed theory, modules and tools that matters in later encounters and bosses, plus durable
long-term rewards across runs. Exact consequential failure arithmetic remains research-owned.
The two-horizon foundation is now measured and folded into the author contract, not implemented:
[[D1695]] blocks theory rewards on a missing runtime passage authority, [[D1696]] blocks server-
owned cosmetic awards on browser-local catalogs, campaign-schema lane 2 is claimed ([[D1697]]),
and generic durable skip-start/modifier/variant ids remain refused without a registry and consumer
([[D1698]]). The amended `campaign-core` specifies separate ownership/equipment/availability,
universal later+boss opportunity, exact prestige, event-owned abandonment, idempotent portable
awards and the complete Campaign home→map→prep→play→result→Review journey. The fourth author repair
closes [[D2420]]–[[D2427]] at the contract tier: a real partial unique index, discriminated event
revision, durable result replay, exact theory/inventory event cuts, compiler-owned curriculum facts,
truthful account/appliance scope and abandoned-history projection are exercised by the retained 34
arms plus 9 new falsifiers. The fourth fresh review returns that repair on [[D2620]]–[[D2624]]:
charged live mutations have no replayable command identity, assistance receipts cross pack/context
subjects, duplicated SQL ownership can disagree, event semantics remain mutable/unparsed and the
official-curriculum model omits most of criterion 30. `make
campaign-two-horizon-fourth-fresh-review` retains all 43 author checks and reproduces 5/5. A bounded
fifth author repair now closes those contract seams: one charged cross-aggregate command/result,
exact assistance-subject equality, composite relational ownership, closed recursive events and a
pinned-document curriculum compiler. `make campaign-two-horizon-fifth-author-repair` retains the
43 controls and passes five new boundary groups plus strict TypeScript. Another fresh review and
named dependencies still gate implementation.

The 2026-09-05 fifth fresh Campaign review returned that repair on [[D2736]]–[[D2741]]. A
provider-failed command has no durable row; charged commands are detached from campaign/play
identity and play revision; assistance receipts omit and can invent authority; event digests do not
cover their command envelope; the official-curriculum compiler accepts and emits a smaller object;
and three draft/returned dependencies are called accepted. `make
campaign-two-horizon-fifth-fresh-review` retains the complete author chain and reproduces 6/6.
Campaign schema/migration/routes/content stay held for a sixth repair and fresh review, after which
the separate boss, catalogue, durable-variety and full-journey milestones still remain. Receipt:
`planning/campaign/fifth-fresh-independent-buildability-review-2026-09-05.md`.

The same-day sixth Campaign author repair closes [[D2736]]–[[D2741]] at contract tier. Durable
no-event command settlement, exact two-aggregate revision authority, storage-derived sealed
assistance subjects, canonical whole-event integrity, full sealed curriculum compilation and live
dependency-state parity execute under `make campaign-two-horizon-sixth-author-repair`; the retained
author chain and 6/6 new groups pass with strict TypeScript. Campaign schema/migration/routes/content
remain held for another genuinely fresh review and accepted dependencies. The boss, catalogue,
durable-variety, full-journey and official-content milestones remain independently open. Receipt:
`planning/campaign/sixth-author-repair-2026-09-05.md`.
The full-game successor is now explicit rather than hidden in a discharge: `campaign-boss-games`
owns campaign-schema lane 3 and the complete Act-II position-game journey. It composes one exact
calibrated human-like bot profile, rules-terminal result, clean rating versus explicit
void-before-Support activation, atomic Campaign+run+rating start/finish, Review and lifecycle
receipts. Campaign remains incomplete until that journey and one official Act-II boss ship.
Variant campaigns remain a successor structure, not a `DrillRun.rules` rider: [[D1681]] proves the
current pack-seal campaign cannot advance an evidence-dark Tier-2 node without inventing a verdict.

### 10. Human play, live sources, clocks, variants, and social return

<!-- roadmap-capability: social_play -->

**State: primitives/screens, no coherent complete product.** Sessions, imports, Arena legs,
invitations and pause/branch mechanics exist. Native pairing/rating, invitation transitions,
live-follow growth, clocks, variants, provider challenge/result return, two-device proof and
event-ready aggregation remain incomplete.

**1.0 exit:** casual native, rated native, imported, live-follow, match and Arena are named flows
with explicit terms; two humans create/join/play/pause/resume/finish/rematch and reach Review;
clocks/results are authoritative where claimed; source/provider/variant identity survives;
provider-off fallback works; assistance/fair-play ceilings are server-enforced. Schema retains a
future event/round/pairing/result aggregate without pretending 1.0 runs a public tournament.

Primary RFCs: `live-sources`, `live-following`, `social-play`, `recorded-clocks`,
`enforced-clocks`, `variants`. UX owner: LIV items shared with professional workflows.
The 2026-08-26 variants re-review returns the full-family contract on [[D1674]]–[[D1682]]. Tier-2
play requires a rules-aware branch/move/terminal authority, durable setup identity, normalized PGN
setup classification, a packaged Fairy-Stockfish operation, rules-bearing evidence requests,
typed rung/admission closures and real entry-point readers. The current standard-`Chess` runtime
rejects Crazyhouse drops and validates every variant terminal under standard rules, so lane 0.20
may not land as an optional field over unchanged mechanics.
[[D1684]] now pins the adjacent identity boundary: `rules + setupFamily` is the minimum durable
chess subject, while workflow origin remains separate admission policy. The current importer
silently turns From Position without FEN into the normal start and rejects a supplied Chess960
setup; both must fail the production import matrix before variant support can claim persistence.
[[D1567]] reopens the public-pool cost model for a no-chat product. The 1.0 decision must price
automatic pairing, avoid/block, abort/stall controls, rate limits and operator evidence directly,
without assuming a social-network moderation stack or assuming chess-only play has no abuse case.

### 11. Coach, classroom, streamer, casting, and audience workflows

<!-- roadmap-capability: professional -->

**State: backend primitives, missing composition.** Classrooms, assignments, submissions,
Academy/Stream, overlay, marks, proposals and votes exist unevenly. Finished Teach Live, Review
Submission, audience preview, streamer chrome, simul wall, provider bridge, and complete
role/consent/error workflows do not.

**1.0 exit:** Academy/Stream are explicit presets over the sealed evidence rail; coaches
assign/review with per-run consent and no ambient weakness dashboard; streamers get documented
capture, audience preview, attribution, withholding/delay, voting client, privacy chrome and honest
provider limits; accessibility projections inherit the visible board ceiling. Role bypass,
reconnect, multi-account and source-off cases pass.

Primary RFC: `casting`. Archived teacher/live mechanisms remain dependencies. UX owner: TCH and
the professional subset of LIV.

Two researched scope decisions now sit in this capability rather than outside the roadmap:

- [[D1844]] — decide whether 1.0 serves institution-managed minors. A yes requires explicit
  custodian, recovery, release, audit and safeguarding authority before an RFC; classroom
  membership alone can never imply account control.
- [[D1845]] — decide whether 1.0 ends at the complete rehearsal classroom or also includes
  academy CRM operations such as billing, payroll, parent administration and white labelling.
  Until ruled, those operations are neither silently promised nor silently discarded.

### 12. Responsive layout, accessible input, theming, and PWA

<!-- roadmap-capability: accessibility -->

**State: board input and in-run composition repaired; full client floor not met.** Shared
controller, permanent cells, input modes, semantic grid, themes, stable board geometry and
responsive in-run companion regions are real. The app still has route-wide dead shortcuts,
focus/skip issues, unsupported devices, overflow, post-gesture gaps, weak contrast/animation
instruments, and no coherent PWA/offline/update journey.

**1.0 exit:** board occupies one stable region; nothing grows in its column; adjacent regions
scroll and become drawers/tabs on small screens; every route works with pointer, touch, keyboard,
screen reader, zoom, reduced motion, phone, tablet and desktop; highlights have touch/focus parity;
themes have previews/licensed assets; install/offline/update/rollback are explicit. Owner-device
discharge remains.

Primary RFCs: `accessible-board-input`, `theming`. UX owner: A11 items.

### 13. Identity, privacy, import/export, backup, and deletion

<!-- roadmap-capability: account_data -->

**State: strong primitives, incomplete lifecycle.** Identity/authorization, leases, export/delete,
scoped links and object exports exist. First-run account timing, guest claim, complete disclosure,
portable account import, conflicts, profile/social coverage, backup/restore and recovery UX remain.

**1.0 exit:** learners understand stored/shared data and can export, import, delete and verify it;
links/teacher access are explicit and revocable; isolation/destructive previews pass; self-hosts
back up/restore all durable state; new longitudinal/social/campaign objects cannot land without
lifecycle coverage.

No active RFC is primary because its foundations are archived; this slice owns their residuals.
UX owner: IMP items.

### 14. CI, packaging, deployment, observability, and release

<!-- roadmap-capability: operations -->

**State: required test ownership is separated; release proof is incomplete.** Software contracts,
repository governance, real-content compatibility, browser journeys and interaction matrices are
separate named gates; Node/pnpm/Stockfish are pinned and local parity runs the same required tiers.
The mutable graduation-plan census is now a manual authoring instrument rather than a software
gate. Missing: release-container production-boundary coverage, Compose smoke and prior-schema
migration, live degradation health, safe profiles, runtime content allow-list, backup/restore/
update/rollback, SBOM/notices/signatures, model/runtime rights, and complete multi-architecture
proof.

The 2026-09-05 fifth provider-health author repair closes [[D2753]]–[[D2760]] and self-audit
[[D2762]]–[[D2764]] at contract tier. Exact named checkpoint exports, separate consumer
declarations, sealed renderer/exchange/registry/generation authorities, a 512-entry exact cache and
SQLite opponent recovery now execute. The repair caught stale/cross-registry release receipts,
caller-cleared backoff and cross-run idempotency reuse before publication. `make
provider-health-fifth-author-repair` retains the complete chain, passes 8/8 new groups plus strict
TypeScript, and remains enrolled in ordinary verification via [[D2761]]. Both implementation
checkpoints remain held for fresh review and the provider-protocol/exchange prerequisites; receipt:
`planning/provider-health-degradation/fifth-author-repair-2026-09-05.md`.

The 2026-09-02 [[D2503]] repair keeps real-content truth while removing repeated whole-corpus work
from its own test file: one 92-pack census supplies both declarations and the no-declarations view;
live-source, read-only and corpus assertions remain on that result; determinism and mutation
falsifiers use isolated representative fixtures. No timeout rose and no mutable cross-file cache
was introduced. The normal content tier moved from two 24–36 minute timeout failures to 16 files /
172 tests green in 21.69 seconds.

The same verification checkpoint closed [[D2504]]: the named pack-capability aggregate had two
stale positive assertions from before structured capability/declaration identity and stopped before
the newest repair. Both were rebased without weakening their sites, versions or no-parallel-field
negatives, and the sixth repair is now an aggregate dependency. The complete
`make pack-capability-author-contract` is green.

The 2026-09-04 [[D2619]] repair moves the whole-corpus construct reach census out of the 5-second
parallel software unit tier into the declared real-content tier and extends `test-tier-check` to
refuse future unlisted `constructReachReport()` consumers. The focused result is 181 software files /
1110 tests and 17 content files / 173 tests green; no timeout was raised and the synthetic vocabulary
tests remain fast software contracts.

**1.0 exit:** documented commands reproduce CI without hijacking normal commits/pushes; every gate
has one named test tier and failure meaning; product contracts use synthetic fixtures, content
acceptance owns real-pack assertions, browser smoke uses stable semantic roles rather than mutable
prose, and production claims cross the actual application/container boundary. Releases build
verified bytes, boot digest-pinned Compose on a clean host, serve advertised journeys, exercise
engine degradation, migrate a prior DB, back up/restore, update/roll back, and publish licences/
SBOM/signatures. Health is live, not a startup snapshot.

Primary RFCs: `storage-backup-recovery` for F12-C/D608, `safe-deployment-profiles` for
F12-A/D607/D1846/D1847, `provider-health-degradation` for F12-D/D609/D1848, and
`verifiable-runtime-distribution` for F12-E1/D610/D615/D1580/D1849/D1850. F12-E2 retains D611's
final F3/F4 runtime-content join. [[D1448]], the remaining F12 children, packaging checks, workflows
and deploy artifacts own the other residuals.

The 2026-09-04 third storage-backup author repair closes the draft seams in
[[D2608]]–[[D2613]] without claiming implementation. Inherited FD 3 now establishes its own lock
authority; publication durably commits marker removal; prepare and readiness checks have truthful
lifetimes; exact check operations and canonical UUID identities are non-forgeable; and replacement
recovery journals forward and rollback progress per member. `make
storage-backup-third-author-repair` retains 23 prior controls and passes 6/6 new behavioral groups
plus strict TypeScript. Backup/restore implementation and D608 remain held for another genuinely
fresh review; receipt: `planning/storage-backup-recovery/third-author-repair-2026-09-04.md`.

The 2026-09-05 fourth fresh storage-backup review returned that repair on
[[D2724]]–[[D2729]]. The state machine still cannot observe recorded byte digests; privately sealed
checks cross database subjects and operation shapes; journal rewrites/discovery are not a durable
protocol; v1/v5 UUIDs re-enter a v4-only authority; the real `/readyz` route is absent from both the
app and consumer census; and mutable application revisions remain representable. `make
storage-backup-fourth-fresh-review` retains the complete author chain and reproduces 6/6. This keeps
backup/restore correctly held before data-loss and false-readiness seams reach production; receipt:
`planning/storage-backup-recovery/fourth-fresh-independent-buildability-review-2026-09-05.md`.

The 2026-09-05 fourth storage-backup author repair addresses [[D2724]]–[[D2729]] without claiming
implementation. Replacement recovery now carries exact byte identities; checks derive from one
sealed operation/action/storage subject; one fixed journal directory has atomic fsynced publication
and unambiguous restart discovery; operation/revision identities are runtime-narrowed; and the
canonical `/readyz` response joins the actual application route and 14-boundary census. `make
storage-backup-fourth-author-repair` retains the complete chain and passes 6/6 new groups plus
strict TypeScript. Backup/restore and D608 remain held for another genuinely fresh review; receipt:
`planning/storage-backup-recovery/fourth-author-repair-2026-09-05.md`.

The 2026-09-04 second safe-deployment author repair closes [[D2614]]–[[D2618]] at the draft tier.
One mounted canonical image crosses into and is attested by the app; runtime config compilation and
exact profile/operation proof are executable; live TLS identity records chain/SPKI/leaf changes; and
durable explicit migration distinguishes initialization/restart/profile change while invalidating
sessions and public tokens before new ingress. `make safe-deployment-second-author-repair` retains
8/8 prior controls and passes 5/5 new behavioral groups plus strict TypeScript. Production profile
implementation remains held for another genuinely fresh review; receipt:
`planning/safe-deployment-profiles/second-author-repair-2026-09-04.md`.

The 2026-09-05 third fresh safe-deployment review returned that repair on
[[D2730]]–[[D2735]]. The mounted image admits profile-impossible tuples; sealed checks are detached
from the deployment they claim to prove; the executable success object omits the declared receipt
union and immutable revision rules; TLS fingerprints lack handshake/trust/clock authority;
readiness bypasses storage's canonical proof; and migration effects are caller-authored memory
rather than a durable journal. `make safe-deployment-third-fresh-review` retains both prior author
gates and reproduces 6/6. The three supported profiles and production release proof remain held for
one author repair and another genuinely fresh review; receipt:
`planning/safe-deployment-profiles/third-fresh-independent-buildability-review-2026-09-05.md`.

The 2026-09-05 third safe-deployment author repair addresses [[D2730]]–[[D2735]] without claiming
implementation. Expected-digest loading validates the complete profile relation; checks and the
full canonical terminal receipt union derive from one sealed config/image/artifact/origin subject;
TLS proof binds trust, chain, singleton SAN and canonical clock; readiness composes storage and
deployment attestations; and an atomic fsynced fixed-file journal surrounds durable session/token
effects, exact target readiness and ingress publication across restart. `make
safe-deployment-third-author-repair` retains both earlier author gates and passes 6/6 new groups
plus strict TypeScript. Production profiles and release proof remain held for another genuinely
fresh review; receipt:
`planning/safe-deployment-profiles/third-author-repair-2026-09-05.md`.

## Production surface inventory

### Client routes

| Surface | Reality | 1.0 owner |
|---|---|---|
| Home, Play, run | Live; arrival/composition/layout incomplete | Rehearsal |
| Review, story | Live; whole-game depth incomplete | Review |
| Rating, Learn | Live client routes; API boundary/longitudinal product incomplete | Learner model |
| Live, session, overlay | Live; social/professional workflows incomplete | Social / Professional |
| Create | Live; author tooling/parity incomplete | Theory/content |
| Library | Live but wrong: duplicate listings, no theory/library workflow | Theory/content |
| Settings | Live but primitive-first; presets/defaults/Advanced hierarchy incomplete | Support |
| Campaign | **Missing** despite ruling and partial backend | Campaign |

### API families

| State | Families |
|---|---|
| Production-routed | `/auth`, `/capabilities`, `/packs`, `/shapes`, `/principles`, `/runs`, `/progress`, `/repertoires`, `/classrooms`, `/assignments`, `/api/shared`, `/shared`, `/select-move`, `/sessions`, `/rated-games`, `/rating`, `/marks`, `/cohorts`; `/healthz` direct |
| Required and missing | `/campaign` |

This is a family inventory, not a completeness claim. Each capability exit names remaining verbs,
authorization, errors, availability and journey proof.

### State and persistence chain

Durable migration head is 25. Live claims serialize longitudinal storage, bot policy, campaign,
live sources/following, clocks, social play and theory joins. Campaign/API work cannot skip its
store/bot predecessors. Every link needs a typed reducer, immutable inputs, idempotent jobs,
resume/rebuild, owner/actor identity, prior-release migration, account lifecycle, and a production
API/client consumer.

The longitudinal-store ninth author repair closes [[D2779]]–[[D2788]] at contract tier. One
file-backed SQLite authority loads replayed source/owner/journal/authorship truth, parses all five
job states, owns clock and claim capabilities, reloads current source at acquisition/validation and
invalidates by restart-stable idempotent stale-writer-fenced CAS. Eleven mutation symbols now
execute committed/rolled-back receipts rather than compiling caller source text. `make
longitudinal-store-ninth-author-repair` retains the full chain and passes eight new groups plus
strict TypeScript. Player style, skills, opening performance, durable tips, bot history and
campaign progression remain blocked on fresh review, acceptance and production persistence; no
downstream feature credit is claimed. Receipt:
`planning/longitudinal-store/ninth-author-repair-2026-09-05.md`.

### CI and deployment

| Layer | Exists | Still required |
|---|---|---|
| Fast local | Lefthook staged diff/type/process/scaffold selection | Stay fast; no full-suite commit/push hijack |
| Software contracts | `make verify-software` | Continue replacing real-corpus dependencies with synthetic fixtures where content bytes are not the subject; no direct-handler substitutes for boundaries |
| Repository governance | `make verify-governance` | Extend persistent assignment beyond UX rows without turning research measurements into product gates |
| Content acceptance | `make verify-content` owns tests that deliberately read committed corpus bytes | Add per-pack schema/provenance/compatibility diagnostics; keep graduation readiness and authored quality as explicit content-wave instruments |
| Browser smoke | `make test-browser-smoke` | Stable acceptance fixtures, semantic roles and core journeys only |
| Accessibility / responsive | `make test-browser-matrix` | Extend post-gesture, input, viewport, zoom and accessibility coverage with useful artifacts |
| Working tree | `make check` plus named browser/content targets | Clean supported-toolchain receipts; all roadmap/product gates wired |
| Exact parity | `make ci-local` | One documented setup and repeatable full pass |
| GitHub | named software, governance, content, browser, and matrix jobs on push/PR | Add production-boundary/container/migration jobs and useful non-browser artifacts |
| Release | tag builds server/Maia and digest-pinned Compose | smoke, upgrade, backup/restore, rollback, rights/SBOM/signing, safe profiles |
| Self-host | dev Compose + release template | reverse proxy/TLS, CPU-default tier, live degradation, operator docs |

## Execution program

This is dependency order, not a single-thread rule. Parallel work is welcome when it does not cross
an unaccepted contract or claimed resource/migration lane.

The machine map now carries nine guarded dependency milestones, each with a current state, exact
next action, latest evidence-backed checkpoint, dependencies, capability coverage and exit.
`make roadmap-check` refuses an unknown dependency, a cycle, missing checkpoint evidence, a
missing exit/action, or any 1.0 capability absent from that graph. Staged product+RFC checkpoints
must update the roadmap and receipt and name their RFC in the changed checkpoint. The readable
spine is:

| Order | Milestone | Outcome |
|---:|---|---|
| 0 | Release truth | Separately owned CI/test tiers and durable work truth |
| 1a | Foundation contracts | Critical evidence/module/state/experience RFCs accepted and resource-safe |
| 1b | Evidence-to-consumer spine | Collectors close through selectors into modules, bots, Review and content compatibility |
| 2a | Stable board and presets | One stable board composition; opinionated flows; primitives under Advanced |
| 2b | Durable product state | Longitudinal, bot, campaign and social state survives rebuild/upgrade and lifecycle operations |
| 2c | Production API closure | Every advertised verb crosses the application and release-container boundary |
| 3 | Complete learner journeys | All core and breadth routes work end to end with defaults, errors, return and accessibility |
| 4 | Official content | A varied pilot, then the complete phase/form/campaign matrix on the stable foundation |
| 5 | Release candidate proof | Clean-host install, provider-off, migration, backup/restore, rollback and owner use |

### Wave 0 — make “done” enforceable

1. Keep work/status/register/intent/roadmap checks green.
2. Keep all 569 UX items in `planning/work-items-1.0.json`; a new item must acquire a capability
   owner and assignment before the guard greens. Extend the same state model to generic queue-only
   ledger rows as touched; do not make a fifth snapshot.
3. Preserve the separated test tiers from [[D1533]]/[[D1538]] and finish the remaining
   container/migration/release tiers; preserve [[D1532]]'s production-boundary family test.
4. Land research coverage and manifest-freshness guards; preserve negative results.

### Wave 1 — freeze evidence/content contracts before broad authoring

1. Re-review/accept capability, claim-anchor, selector/packet/target, module-registration,
   longitudinal and other returned/draft foundations in dependency order.
2. Complete collector discharges and semantic families with non-vacuous validation.
3. Compile producer → projection → selector → module/bot/Review joins; delete raw text paths.
4. Prove a read-only corpus migration/graduation plan before broad authored-byte changes.

**Gate:** no major pack wave until capability compatibility, claim anchors and event versions are
stable enough that a new primitive does not require blind edits to every pack.

### Wave 2 — state reducers, persistence, and production APIs

1. Land longitudinal storage/background rebuild.
2. Land bot persistence, proposals, roster inputs and fallbacks.
3. Land campaign persistence/rebuild, then API.
4. Land live/clock/social migrations in register order.
5. Add principles/theory APIs and close every intercepted API family.
6. Test all advertised families through `createApplication` and the release container.

### Wave 3 — rebuild the client around journeys and presets

1. Establish stable board + scrollable regions + responsive drawers/tabs before adding panels.
2. Land the sealed projection→component authority, then module registration, preset composition,
   disclosure, Advanced controls and typed components.
3. Deliver ARR → run → consequence → compare → terminal as one first-run flow.
4. Deliver full Review, Theory/Library, Campaign, bot cards, profile, native/social, Coach and Stream
   as complete vertical journeys.
5. Burn down all 569 UX item states by capability: correctness/trust, blocked doors,
   layout/accessibility, defaults, then cosmetics.

**Gate:** a route is not complete if it exposes enum/raw JSON/raw cp, requires source settings for
ordinary use, lacks error/empty/loading, or fails viewport/input matrices.

### Wave 4 — graduate content on the stable foundation

1. Reground principles/theory; refresh manifests/source digests.
2. Graduate a varied pilot covering every handshake and negative path.
3. Author the full opening/middlegame/endgame/trajectory/form matrix plus campaign, bot, Review,
   style/skill and theory examples.
4. Use engine/tablebase/explorer/human-model only for claims they support; keep authored chess
   judgment explicit and reviewed.

### Wave 5 — integrated release proof

Run the release artifact through:

1. First run → Just Play → nudge → consequence → rewind → compare → replay.
2. All training forms across opening, middlegame, endgame and trajectory.
3. Finish/import → full Review → retry/branch → theory/drill return → schedule.
4. Distinct bots → play/rematch → behavior record → Review → local bot event.
5. Rating/history → style/skill/opening drill-down → grounded recommendation.
6. Complete campaign with spend, failure, boss, Review and resume.
7. Two-device human game with clocks/result, plus provider/manual import/return.
8. Coach assignment/live/submission and Stream preview/vote/overlay.
9. Keyboard, screen reader, touch, phone, tablet, desktop, zoom, contrast, motion, offline/update.
10. Fresh install, provider-off, backup/restore, prior-version upgrade, rollback, export/delete.

Then the owner plays the same release on their devices. Findings reopen their capability; they do
not become an unowned “polish wave”. 1.0 ships only when every core and breadth capability has all
eight dimensions proven or an explicit owner-approved descope.

## How the other work documents are used

- `planning/WORK.md`: navigation only; points here first.
- `planning/ux-implementation-index.md`: exhaustive UX source register; descriptions and blockers live here.
- `planning/work-items-1.0.json`: persistent per-item lifecycle and capability assignment; workers
  select from this file and update state instead of curating another queue snapshot.
- `codex-wave-2.md`, `codex-wave-3.md`, `codex-queue.md`: tactical/history; cannot declare product
  completion.
- `platform-alignment/1.0-capability-map.md`: research-era synthesis; evidence, not current status.
- `platform-alignment/execution-queue.md`: dependency detail for that program.
- Review/routing/defect/research/RFC queues: source lanes consumed by capability owners.
- `design/BACKLOG.md`: ideas/defects/rulings, not priority.
- `rfc/README.md`: lifecycle/resources, not learner roadmap.

If a source document disagrees with this file about 1.0 state, its evidence still matters but its
rollup claim does not. Update the source register and roadmap together; do not create another
hand-maintained “feature complete” file.

### 2026-09-05 foundation checkpoint — bootstrap independently buildable

The shared-resource bootstrap fourteenth repair passed a fifteenth genuinely fresh executable
review: both literal assistance/workflow descriptors project every root, checked versus open index
access is discriminated, finite keys retain complete targets and optional calls retain all overloads.
The foundation is ready for owner acceptance, after which implementation can unblock the provider,
assistance and semantic-convention resource populations. No production byte is implied by this pass.

### 2026-09-05 evidence-spine checkpoint — candidate packet returned

The candidate packet's tenth repair is not a buildable current foundation. Its focused fixes hold,
but the checkpoint drops the public service/result/cache lifecycle, four retained identity fields,
total collector outcomes/abstentions, and checkmate/stalemate identity. The evidence spine remains
blocked until one composed model carries all of those authorities plus the production-backed
collector graph through a fresh review; old green models cannot be assembled by the implementer.

### 2026-09-06 evidence-spine checkpoint — candidate packet recomposed

The candidate-packet return is author-repaired in one executable checkpoint: the real collector
graph now sits behind candidate-local cooperative scheduling and the complete bounded public
service/cache lifecycle; all seven identity terms, total projection outcomes, abstentions and exact
checkmate/stalemate terminals survive into the receipt. The new gate also proves that a late compile
cannot populate the cache after its deadline. This advances the active evidence spine but does not
accept or implement it: a genuinely fresh review, the value-authority dependency and the returned
promotion installation boundary remain next.

### 2026-09-06 evidence-spine checkpoint — candidate packet returned on service truth

The twelfth fresh review keeps the composed collector graph but proves the service is not yet a
safe shared foundation. It accepts a genuine receipt for another request; lets a queue deadline
terminate active work; cannot emit two declared failure classes; measures a smaller graph than it
caches; does not refresh projected-hit LRU recency; and re-runs loose-piece chess logic to rebuild a
result the registry execution should preserve. Seven executable falsifiers pass under `make
candidate-packet-twelfth-fresh-review`. The evidence spine remains active at contract repair: bots,
hints, Review and packs must not build separate candidate populations around these defects.

### 2026-09-06 evidence-spine checkpoint — candidate service authority repaired

The candidate packet's twelfth author repair now carries canonical request equality, one-shot
queue/compile lifecycle, reachable collector failures, independently proven terminal states, exact
retained-receipt accounting, projection-hit LRU recency and single-invocation total outcomes through
one composed service. `make candidate-packet-twelfth-author-repair` retains all earlier returns and
passes 15/15 current groups plus strict TypeScript. This advances the shared evidence foundation but
does not accept or implement it: a genuinely fresh review, the value-authority dependency and the
returned promotion installation boundary remain next.

### 2026-09-06 foundation checkpoint — concept registry returned at application boundary

The concept registry's third repair is not buildable in the real application order. Storage runs
and completes migrations before the complete built-in plus stored-pack registry can be hydrated,
while both the coordinator and proposed operation claim the same SQLite transaction. Its consumer
receipt also accepts unreachable and type-invalid calls, and its pack lookup accepts a
caller-stamped digest through mutable registry methods. `make concept-registry-fourth-fresh-review`
retains all predecessor evidence and passes five new falsifiers. The foundation-contracts milestone
therefore remains active at author repair; no concept schema, migration or downstream Campaign/
Skills work may treat this contract as accepted.

### 2026-09-06 foundation checkpoint — concept startup authority repaired

The fourth concept-registry author repair closes the returned application boundary without
pretending the schema has shipped. One recoverable two-phase startup now owns the exact order from
prerequisite migrations through registry compilation, transaction-scoped pack hydration and
complete-document digest validation, concept rewrite/receipt/version stamp, commit, then service
readiness. The data operation cannot nest a transaction; historical pack authority is an opaque
sealed snapshot; and the consumer receipt now requires diagnostic-clean, used operations reachable
from the real server/web entries. `make concept-registry-fourth-author-repair` retains the full
chain and passes 5/5 direct inversions plus strict TypeScript. Foundation contracts advance to
another fresh review and the shared-resource bootstrap dependency; no product schema or migration
is accepted yet.

### 2026-09-06 foundation checkpoint — provider obligation preimage returned

The provider-protocol register's third repair is not yet an independently accepted product
preimage. Its receipt can be replaced in an earlier commit because only its self-digest and current
staged state are checked; its set-equality join admits array permutations that change the governed
canonical-resource digest; and neither the schema discriminant nor digest wire grammar is defined.
`make provider-protocol-fourth-fresh-review` retains the complete predecessor chain and executes
three new falsifiers plus the valid generic descriptor control. Foundation contracts remain active
at author repair; provider exchange, source-backed evidence, bot inputs and external-source Support
cannot treat this register as accepted.

### 2026-09-06 foundation checkpoint — concept authority reaches real consumers

The fifth concept-registry author repair closes the six seams found at the application boundary.
Readiness has no public issuer; the migration receives no raw SQL or transaction control; invalid
complete packs fail before hashing; restart requires and recomputes an exact receipt; the committed
graph follows `main.ts → App.svelte → api.ts`; and each registered operation result reaches its
named publication, persistence, query, rendering or wire boundary. `make
concept-registry-fifth-author-repair` retains the entire return/repair chain and passes 6/6 current
groups plus strict TypeScript. Foundation contracts advance to genuinely fresh review and the
shared-resource bootstrap dependency; no concept schema or migration is accepted yet.

### 2026-09-06 foundation checkpoint — provider health recomposed

The eleventh provider-health author repair removes the parallel authorities that let health,
backoff and operation availability contradict each other. One declaration-derived private
composition now owns group state and generation transitions; a sealed exact-subject exchange
outcome updates instance and group truth together; atomic exact-cache lookup owns
`cached_exact_only`; and the strict client result carries plural instances plus block/unavailable
reasons. Monotonic and civil time are separate inputs. `make provider-health-eleventh-author-repair`
retains the full chain and passes 8/8 current groups plus strict TypeScript. The foundation remains
at fresh review and provider protocol/exchange dependencies; no runtime or run-schema byte is
authorized yet.

### 2026-09-06 evidence-spine checkpoint — candidate packet authority repaired

The thirteenth candidate-packet author repair closes the eight returned authority seams without
claiming product implementation. Collectors now receive only their declared dependency image;
invocation and projection failures retain truthful precision; abandoned single-flight generations
cannot poison a later equal request; request errors retain their actual class; and cache entries no
longer charge the process manifest repeatedly. Every receipt read reasserts the exact legal-map,
flattened-move, row, UCI and child-FEN joins. Child-reading membership derives from the admitted
catalogues and is checked against the live collector. `make candidate-packet-thirteenth-author-repair`
retains the full history and passes 22/22 current groups plus the repository-strict TypeScript
contract. The evidence spine advances to genuinely fresh review and its value-authority/provider
dependencies; no production selector, Support, bot, Review or content byte is authorized yet.

The same-day fourteenth fresh candidate-packet review returns that repair on [[D3009]]–[[D3016]].
The readings-only public receipt exposes hidden event dependencies; product construction accepts
authority-looking extras; failure and stats contracts disagree across prose and types; and receipt,
retained-graph and scope closure are incomplete. The named collector fault hook is absent, so the
author suite manufactures the private error it expects rather than exercising the registry.
`make candidate-packet-fourteenth-fresh-review` retains the full chain and passes 8/8 new
falsifiers plus strict TypeScript. The evidence spine stays at one bounded author repair, another
genuinely fresh review and the accepted value-authority dependency before production. Receipt:
`planning/evidence-foundation-ux/shared-candidate-packet-fourteenth-fresh-independent-buildability-review-2026-09-06.md`.

### 2026-09-06 evidence-spine checkpoint — promotion installation authority repaired

The fifteenth promotion author repair closes the five returned composition and semantic-authority
seams at contract tier. One application composition owns configuration and memoizes the application;
all installed generations cross the production pack, sourcing, Syzygy and exact legal-map parsers
before publication; typed store lookups retain those values; and each request, result and receipt is
bound to one application/registry/generation/store/FEN lineage. `make
semantic-collectors-promotion-fifteenth-author-repair` retains the entire return/repair history and
passes 5/5 current groups plus the repository TypeScript contract. The evidence spine advances to
genuinely fresh reviews of this repair and candidate-packet, then the value-authority/provider
dependencies; the held pair remains unimplemented at 12/14.

### 2026-09-06 evidence-spine checkpoint — promotion semantics lost behind the installation repair

The sixteenth fresh promotion review preserves the fifteenth repair's complete artifact validation
and single-flight gains, but returns the held pair on [[D3018]]–[[D3024]]. The exported composition
still accepts any caller path; the model deletes geometry/no-race, live provider/domain resolution,
required geometry/pawn operands and central value receipts; duplicate durable records publish; and
its result algebra no longer matches §3.7. The executable hard negative is decisive: a2 versus b7,
where neither pawn is passed, emits `promotion_race_tablebase` instead of completed/no-evidence.
`make semantic-collectors-promotion-sixteenth-fresh-review` retains the full chain and passes 6/6
groups plus strict TypeScript. The spine remains 12/14 pending one composed author repair, another
fresh review and the provider/value dependencies.

### 2026-09-06 foundation checkpoint — provider obligation authority returned at lifecycle boundary

The sixth fresh provider-protocol review preserves the fifth repair's exact accepted receipt but
finds that its surrounding authority cannot survive the very product lifecycle it is meant to
authorize. Legal implementing and archive successors fail; an uncommitted withdrawn source remains
green; an arbitrary lookalike repository can mint authority; and a caller-built resource validates
while the product root is absent. `make provider-protocol-sixth-fresh-review` retains the complete
chain and passes 5/5 new counterexamples plus strict TypeScript. Foundation contracts remain active
at author repair and the generic bootstrap dependency; provider exchange, external evidence and bot
inputs cannot treat this register as accepted.

### 2026-09-06 foundation checkpoint — concept authority returned at composition boundary

The sixth fresh concept-registry review preserves the fifth repair's private migration and pack
validation gains but proves its composed application authority remains false. Consumer closure
accepts counterfeit boundary names and calls hidden inside uncalled functions; a shallow combined
TypeScript program lets web options erase server diagnostics; and the same artifact set receives a
different restart digest when its load order changes. Startup separately accepts a digest-shaped
fake registry, exposes valid readiness to a callback that can retain it while failing, and leaves
the bootstrap database usable after rejection. `make concept-registry-sixth-fresh-review` retains
the complete chain and passes 6/6 executable counterexamples plus strict TypeScript. Foundation
contracts remain active at bounded author repair; no concept schema, migration, Campaign, Skills or
cross-pack learner-history consumer may treat this RFC as accepted.

### 2026-09-06 foundation checkpoint — provider health returned at authority and policy boundaries

The twelfth fresh provider-health review preserves the eleventh repair's unified state and exact
cache gains but proves six required boundaries remain open. Callers can mint successful provider
outcomes and arbitrary generation resets; the composed authority dropped lease renewal and expiry;
rate-limit outcomes cannot carry a longer upstream `Retry-After`; test-only providers receive valid
release receipts; and cache entries can outlive the declared 24-hour maximum. `make
provider-health-twelfth-fresh-review` retains the complete chain and passes 6/6 executable
counterexamples plus strict TypeScript. Foundation contracts remain active at bounded author repair;
no provider exchange, external evidence, bot input, Support availability or release proof may treat
this RFC as accepted.

### 2026-09-06 foundation checkpoint — storage recovery returned at real boundaries

The fifth fresh storage-backup review preserves the fourth repair's digest grammar, UUID narrowing
and closed response shapes, but proves the alleged authorities remain caller projections. Public
functions mint storage subjects and passed semantic checks from supplied bytes and arrays; a
`verified` journal accepts the old main still live and the new main still staged; the durable
publication check compares four strings; a second temp intent is never read; and arbitrary status
and body bytes mint readiness without the application route. `make storage-backup-fifth-fresh-review`
retains the complete chain and passes 6/6 executable counterexamples plus strict TypeScript.
Foundation contracts remain active at bounded author repair; no backup/restore, update/rollback,
release rehearsal or clean-host proof may treat this RFC as accepted.

### 2026-09-06 foundation checkpoint — safe deployment returned at live-operation boundaries

The fourth fresh safe-deployment review preserves the third repair's closed compiled shapes and
durable JSON publication but proves they are not release authority. A caller can mint trusted TLS
for an absent server, self-attest eleven deployment checks, serialize readiness without invoking the
application, and publish migrated state after a no-op ingress seal. The migration edits private
look-alike tables, clean initialization ignores existing storage, receipt parsing admits crossed
profile arms, and mounted-image compilation never opens the mount. `make
safe-deployment-fourth-fresh-review` retains the complete chain and passes 8/8 executable
counterexamples plus strict TypeScript. Foundation contracts remain active at bounded author repair;
no public deployment, operator workflow, migration or release proof may treat this RFC as accepted.

## Checkpoint — Campaign returned at operation and evidence authority

Campaign foundation remains incomplete after its seventh fresh independent review. The sixth repair
retains durable command-result replay and canonical event-envelope integrity, but `rewind`, `fork`,
`group` and `simulate_enter` can report `committed` while changing no play graph and appending no
Campaign event. The same build surface lets callers author provider, assistance, event, document,
human-review and curriculum-registry facts that it later treats as authority.

`make campaign-two-horizon-seventh-fresh-review` retains the complete predecessor chain and passes
7/7 new able-to-fail controls plus strict TypeScript. The next bounded author repair must connect
those contracts to the actual run operation, provider, persistence, authentication and owning
registry boundaries, followed by another fresh review. Campaign API, web route/map, complete pilot,
full-game bosses, catalogue progression, durable variety and end-to-end verification remain separate
required 1.0 work; this checkpoint closes none of them.

## Checkpoint — Longitudinal state returned at mutation and worker authority

The learner-history foundation remains incomplete after its tenth fresh independent review. The
ninth repair retains file-backed source bytes and store-scoped claim shapes, but every named source
operation is a receipt-only no-op; duplicate requests destroy healthy work; caller-selected cuts
can regress the watermark; the parser and database admit different lifecycle states; eligible
retries and expired claims cannot run; legacy provenance is reversed; and the normative V4 source
identity was changed without a migration contract.

`make longitudinal-store-tenth-fresh-review` retains the complete predecessor chain and passes 8/8
new able-to-fail controls plus strict TypeScript. The next bounded repair must compose the real
storage mutations with atomic invalidation, close one exact job-state algebra and implement the
complete retry/reclaim/renew/fail/publish CAS lifecycle before another fresh review. Player style,
skills, opening performance, longitudinal recommendations, profile export/deletion and every
learner-facing history surface remain blocked on that accepted and implemented foundation.

## Checkpoint — Bot policy returned at identity, replay and provider authority

The bot foundation remains incomplete after its fifth fresh independent review. The fourth repair
retains normalized top-p and honest request-conditional cache state, but a genuine profile digest
does not bind family/layers; coordinated stored-decision rewrites can promote a sampler-excluded
move; replay trusts caller envelopes; the request grammar is open; duplicate Stockfish rows select
guard truth; durable provider authority is local; roster availability trusts substituted profiles
and a superseded health checkpoint; and the model fails the repository TypeScript dialect.

`make bot-policy-fifth-fresh-review` retains the 31+6 predecessor controls and passes 8/8 new
able-to-fail groups plus its TypeScript checkpoints. The next bounded repair must resolve exact
catalog members, reconstruct decisions from parsed shared authorities, load replay from durable
events, close request/provider/population grammars, rebase on accepted current provider health and
inherit the repository compiler contract before another fresh review. The 4×3 roster, calibrated
human-likeness, route source, cards, rematches, Review integration, phase/endgame behavior and bot
tournaments remain separate required 1.0 work.
