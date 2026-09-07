# RFC: Evidence job durability — admission, lease, settlement, and the HTTP capability-operation census

- **Status:** draft — **carried out of `rfc/pack-capability-contract.md` on 2026-09-06, returned and
  unrepaired.** It inherits [[D2429]], [[D2509]]–[[D2513]], [[D2587]]–[[D2592]],
  [[D2673]]–[[D2677]], [[D2742]]–[[D2747]], [[D2771]]–[[D2778]], [[D2802]]–[[D2808]] and
  [[D3002]]–[[D3008]] **unresolved**. No implementation is authorised.
- **Author:** claude (cut, not drafted — every specification byte below is the parent RFC's, moved
  verbatim; only this preamble is new)
- **Created:** 2026-09-06
- **Registered:** 2026-09-07 under [[D3122]], in the same change that adds its Active row and
  transfers the storage migration claim from the parent.
- **Parent:** `rfc/pack-capability-contract.md` — see its §4.1a, §5.1 and Changelog for the cut.

```tabiya-claims
migration | position behind longitudinal-store | evidence_job_batches + evidence_jobs durable admission, lease, retry, settlement, staged result and consumption rows + evidence_result_sequences never-reused per-run allocator
```

## Summary

A pack capability may be unmet for exactly two ruled causes ([[D1077]]), and the parent RFC states
both plus deployment reachability and static unsupported behavior. This document owns the
population of operations and their request-synchronous effects, plus what happens when provider work is admitted
now and settled later. Concretely — the closed HTTP and queued-gateway operation census that binds
every route to one capability source, and the durable `evidence_job_batches` / `evidence_jobs` /
`evidence_result_sequences` admission, lease, retry, settlement, cancellation and consumption model
that [[D2520]] required after it measured that `POST /runs/:id/analysis` returns 202 before the
provider is ever called. It specifies no capability identity, no semantics digest, no pack `requires`
array and no migration planner; those are the parent's and stay there.

## Why this is a separate document

The parent grew this material one review round at a time, and the growth is measurable: of the 83
ledger rows that named the parent as their blocker, **71 were the parent's own review findings**, and
**59 of those 71** are about the two sections below. Seventeen rounds of review were spent on an
asynchronous job system inside a document about versioning evaluator meaning — codex's *"enormous
shadow implementation"* exactly, and the same shape the owner ruled on in [[D3034]]. Splitting it
does not repair a single one of the inherited defects; it puts them where they can be worked without
holding twelve unrelated dependents.

## Inherited defects — none discharged

Every row listed in the Status line above is open against the text below. The seventeenth fresh
review's reproducer, `make pack-capability-seventeenth-fresh-review`
(`tools/d3002-pack-capability-seventeenth-fresh-review/`), reads §2's DDL **from this file** and
passes 7/7 — that is, it still reproduces all seven [[D3002]]–[[D3008]] defects. Its round-by-round
history is at `planning/pack-capability-contract/review-history.md`.

## §1. The capability-operation census

*(moved verbatim from `rfc/pack-capability-contract.md` §5.1, lines 1151–1345 at `c37c6eb8`)*

The operation boundary is shared and typed. It never accepts a requirement list from a route, and
it does not collapse three creation sources into a fictional always-packed operation:

```ts
type HttpCapabilityOperationId =
  | "pack.register"
  | "run.create.pack" | "run.create.position" | "run.create.imported"
  | "run.create.rated" | "run.create.playtest" | "run.create.repertoire_gap"
  | "run.create.flip" | "run.create.duplicate_pack" | "run.create.duplicate_position"
  | "opponent.select" | "story.public" | "shared.join_page"
  | "run.graph" | "run.events" | "run.evidence.read" | "run.authored_feedback"
  | "run.pgn" | "run.grants.read" | "run.reasoning.read" | "run.import_record"
  | "run.story" | "run.share.list" | "run.derivations" | "run.marks.read"
  | "run.human_split" | "run.corpus" | "run.group_reply"
  | "run.branch_decidedness" | "run.analysis" | "run.prediction"
  | "run.voice" | "run.speech" | "run.reasoning_review"
  | "run.group.hand_picked" | "run.group.authored"
  | "run.group.human_replies" | "run.group.engine_top_n"
  | "run.marks.replace" | "run.marks.rescope"
  | "run.deletion_preview" | "run.delete" | "run.distill"
  | "run.share.create" | "run.share.revoke"
  | "run.lease" | "run.reveal" | "run.schedule"
  | "run.grant" | "run.revoke"
  | "run.move.user" | "run.move.opponent_received"
  | "run.rewind" | "run.fork" | "run.compare" | "run.simulate" | "run.simulate_enter"
  | "run.reasoning.record" | "run.evidence.apply";
type QueuedProviderOperationId =
  | "evidence.stockfish_analysis"
  | "evidence.tablebase_probe";
type CapabilityOperationId = HttpCapabilityOperationId | QueuedProviderOperationId;
type CreateSessionCapabilitySource =
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest: string }
  | { readonly kind: "position"; readonly opponentPolicy: PositionOpponentPolicy }
  | { readonly kind: "imported"; readonly opponentPolicy: PositionOpponentPolicy };
type OperationCapabilitySource =
  | { readonly kind: "session_create"; readonly sessionKind: CreateSessionCapabilitySource["kind"] }
  | { readonly kind: "registered_pack"; readonly phase: "static_admission" }
  | { readonly kind: "run_session_operation" }
  | { readonly kind: "fixed_registry" }
  | { readonly kind: "none" };
type CapabilityConsumerId = EvidenceConsumerId | OperationalCapabilityConsumerId;
interface OperationCapabilityBinding {
  readonly operationId: CapabilityOperationId;
  readonly source: OperationCapabilitySource;
  readonly consumer?: CapabilityConsumerId;
}
type CheckedOperationCapabilityBinding =
  | { readonly operationId: CapabilityOperationId; readonly source: { readonly kind: "none" } }
  | { readonly operationId: CapabilityOperationId; readonly source: Exclude<OperationCapabilitySource, { readonly kind: "none" }>; readonly consumer: CapabilityConsumerId };
interface CapabilityRouteBranch {
  readonly operationId: HttpCapabilityOperationId;
  readonly method: "GET" | "POST" | "PUT" | "DELETE";
  readonly route:
    | "/packs/drafts/:draftId/register" | "/packs/drafts/:draftId/playtest"
    | "/runs" | "/runs/import" | "/rated-games" | "/select-move"
    | "/repertoires/:id/gaps/enter" | "/api/shared/:token/story" | "/shared/:token"
    | "/runs/:runId/share/:token" | "/runs/:runId/:action";
  readonly action?: string;
  readonly discriminant?:
    | { readonly path: "/session/kind"; readonly value: "pack" | "position" }
    | { readonly path: "/rescopeFrom"; readonly presence: "present" | "absent" }
    | { readonly path: "/op"; readonly value: "grant" | "revoke" }
    | { readonly path: "/selection"; readonly presence: "present" | "absent" }
    | { readonly path: "/source"; readonly value: "hand_picked" | "authored" | "human_replies" | "engine_top_n" }
    | { readonly loaded: "run.sessionKind"; readonly value: "pack" | "position" }
    | { readonly loaded: "publicToken.scope"; readonly value: "story_read" | "session_join" };
}
```

`OperationCapabilityBinding` is the generated read projection. Authoring accepts only
`CheckedOperationCapabilityBinding`, so a non-`none` source without a consumer and a `none` source
with a consumer are unrepresentable; no call site constructs the looser projection directly.

The reviewed seventh-author base image is
`tools/d2509-pack-capability-seventh-author-repair/operation-authority.json`; the eighth-author
post-image is its digest-pinned composition with
`tools/d2518-pack-capability-eighth-author-repair/operation-amendment.json`. Neither is a second
production registry: implementation translates the composed image into co-located typed route,
worker and enqueue-origin declarations, then retires both author artifacts.
`CapabilityOperationId`, `CAPABILITY_OPERATION_BINDINGS`, the HTTP resolver and the worker resolver
are generated from those declarations. A source census independently parses the live
`parseRunRoute` action grammar, all method/action handler branches, every run-creation storage site,
both public-card branches, every enqueue origin and every call through either synchronous or queued
provider gateway; set inequality fails. Consequently a new route, creation site, enqueue origin or
provider call fails before anyone edits a hand-written expected list.

The bounded population is syntactic and deliberately wider than “operations we currently think
need a provider”: every supported method/action branch under `parseRunRoute`, every route that
creates a run, Pack Studio registration, `/select-move`, public Story and share-token revocation.
Account, classroom, shape-authoring and authenticated live-session APIs are outside this pack/run
boundary by their distinct route parsers, and the census asserts those exclusions by parser
identity. The shared HTML route is inside because one of its token scopes renders Story evidence.
The composed author image contains **36/36 run actions, 48 run-route branches, 12 external-route
branches and 60 HTTP branches over 59 unique HTTP operation ids**, plus **2 queued provider
operations** for **61 unique capability operation ids overall**. The following table is only the
capability-bearing and split-branch excerpt; the composed artifacts are the complete author image:

| method + route | body branch | operation id | capability source |
|---|---|---|---|
| `POST /packs/drafts/:draftId/register` | — | `pack.register` | `registered_pack/static_admission` |
| `POST /packs/drafts/:draftId/playtest` | — | `run.create.playtest` | `session_create/pack` |
| `POST /runs` | `session.kind=pack` | `run.create.pack` | `session_create/pack` |
| `POST /runs` | `session.kind=position` | `run.create.position` | `session_create/position` |
| `POST /runs/import` | — | `run.create.imported` | `session_create/imported` |
| `POST /rated-games` | — | `run.create.rated` | `session_create/position` |
| `POST /repertoires/:id/gaps/enter` | — | `run.create.repertoire_gap` | `session_create/position` |
| `POST /select-move` | — | `opponent.select` | `fixed_registry` |
| `GET /runs/:runId/human-split` | — | `run.human_split` | `run_session_operation` |
| `GET /runs/:runId/corpus` | — | `run.corpus` | `run_session_operation` |
| `GET /runs/:runId/story` | — | `run.story` | `run_session_operation` |
| `GET /api/shared/:token/story` | — | `story.public` | `run_session_operation` |
| `GET /shared/:token` | loaded token scope `story_read` | `story.public` | `run_session_operation` |
| `GET /shared/:token` | loaded token scope `session_join` | `shared.join_page` | `none` |
| `POST /runs/:runId/group-reply` | — | `run.group_reply` | `run_session_operation` |
| `POST /runs/:runId/branch-decidedness` | — | `run.branch_decidedness` | `run_session_operation` |
| `POST /runs/:runId/analysis` | — | `run.analysis` | `run_session_operation` |
| `POST /runs/:runId/prediction` | — | `run.prediction` | `run_session_operation` |
| `POST /runs/:runId/voice` | — | `run.voice` | `run_session_operation` |
| `POST /runs/:runId/speech` | — | `run.speech` | `run_session_operation` |
| `POST /runs/:runId/reasoning-review` | — | `run.reasoning_review` | `run_session_operation` |
| `PUT /runs/:runId/marks` | `rescopeFrom` absent / present | `run.marks.replace` / `run.marks.rescope` | `none` / `none` |
| `POST /runs/:runId/deletion-preview` | — | `run.deletion_preview` | `none` |
| `POST /runs/:runId/delete` | — | `run.delete` | `none` |
| `POST /runs/:runId/distill` | — | `run.distill` | `none` |
| `POST /runs/:runId/share` | — | `run.share.create` | `run_session_operation` |
| `DELETE /runs/:runId/share/:token` | — | `run.share.revoke` | `none` |
| `POST /runs/:runId/flip` | — | `run.create.flip` | `session_create/position` |
| `POST /runs/:runId/lease` | — | `run.lease` | `none` |
| `POST /runs/:runId/reveal` | — | `run.reveal` | `none` |
| `POST /runs/:runId/duplicate` | loaded `sessionKind=pack` / `position` | `run.create.duplicate_pack` / `run.create.duplicate_position` | `session_create/pack` / `session_create/position` |
| `POST /runs/:runId/schedule` | — | `run.schedule` | `none` |
| `POST /runs/:runId/grants` | `op=grant` / `op=revoke` | `run.grant` / `run.revoke` | `none` / `none` |
| `POST /runs/:runId/group` | `source=hand_picked` / `authored` | `run.group.hand_picked` / `run.group.authored` | `none` / `none` |
| `POST /runs/:runId/group` | `source=human_replies` / `engine_top_n` | `run.group.human_replies` / `run.group.engine_top_n` | `run_session_operation` / `run_session_operation` |
| `POST /runs/:runId/moves` | `selection` absent / present | `run.move.user` / `run.move.opponent_received` | `none` / `none` |
| `POST /runs/:runId/rewind` | — | `run.rewind` | `none` |
| `POST /runs/:runId/fork` | — | `run.fork` | `none` |
| `POST /runs/:runId/compare` | — | `run.compare` | `none` |
| `POST /runs/:runId/simulate-enter` | — | `run.simulate_enter` | `none` |
| `POST /runs/:runId/reasoning` | — | `run.reasoning.record` | `none` |
| `POST /runs/:runId/evidence` | — | `run.evidence.apply` | `none` |

The shared HTML handler must resolve the token once by hash before dispatch: `story_read` enters
`story.public`, while `session_join` enters the local `shared.join_page`. Trying Story and then
catching every error as a join-page discriminator is forbidden: provider failure on a real Story
token must not change token scope, and a join token must never enter Story capability enforcement.

The excerpt omits the local read/mutation rows only for legibility; they remain literal in the
60-branch author image. The implementation does not regex-generate a dispatcher from formatting.
Instead, route declarations and provider-operation wrappers are production authority, while the
AST census independently discovers their population and compares semantic identities. A call to a
provider outside `executeCapabilityOperation`, a run-creation storage call outside a declared
creation operation, an action in `parseRunRoute` without all of its supported methods, or an
invented `/studio/drafts` prefix is a distinct failure.

`run.create.pack` and Pack Studio playtest resolve authenticated pack identity and require the
complete canonical `pack.requires` set against configured support. Position, imported, rated,
repertoire-gap and flip creation cannot resolve or impersonate a pack: their sealed session source
selects the exact opponent/runtime requirements through the same registry mappings that own those
policy modes. Duplicate selects pack or position only from the already-authorized stored source
run, never from a request discriminator. A mode with no requirement yields an explicit empty
derived set; absence is a registry fact, not a caller-supplied empty array. Crossed fixtures prove a
position/imported source cannot select `registered_pack`, a pack source cannot select the non-pack
resolver, a duplicate request cannot change source kind, and a body/session-kind disagreement fails
before admission. `pack.register` separately uses `registered_pack/static_admission` over the
parsed draft pack.

Provider operations plus `opponent.select` use either `run_session_operation` or an exact
fixed-registry capability. A run-session resolver loads the authenticated immutable run and derives
the union of (a) the operation consumer's fixed capability requirements, (b) the exact opponent
policy requirements of that session, and (c) `pack.requires` only when the run actually has a pack.
Position and imported sessions therefore remain first-class rather than failing a fictitious pack
lookup. Routes supply only `{operationId, runId/idempotencyKey when applicable}`; the operation id
is the generated result of the closed route-branch resolver, not a caller field. They cannot add,
omit or replace capability ids, a pack path or a requirement array.

Every `source:none` action still passes through the operation census but does not call transient
capability enforcement; `run.move.opponent_received`
commits an already admitted provider-delivery receipt, so provider death after delivery cannot
invalidate the received move. Adding a mutating route fails the census until it is assigned to
exactly one provider-bound or explicit-none source. The four `group.source` arms are distinct
operations: `hand_picked` and `authored` are local; `human_replies` and `engine_top_n` must pass the
opponent consumer before `select`/`enumerate` and before the first branch or distribution write.
Crossed fixtures move one operation between sets, omit a provider binding, add an extra caller id,
make a discriminator overlap or gap, and place the check after the first write.

Before a first-flight provider operation appends any run event or mutates run state,
`executeCapabilityOperation({operationId, runId}, body)` derives the authoritative set above and
reads the current deployment projection. It also resolves the operation's declared consumer and
joins that consumer to its compiled `ProviderOffBehavior`; routes never pass either a behavior or a
capability list. Idempotent replay first returns the stored terminal operation receipt and does not
re-decide historical provider reachability; a concurrent first flight shares one admitted
operation. Recovery of a previously uncommitted request re-runs the pre-write check. This paragraph
describes request-synchronous operations; queued evidence uses §5.2's durable admission boundary.


## §2. Durable admission and settlement

*(moved verbatim from `rfc/pack-capability-contract.md` §5.2, lines 1357–1789 at `c37c6eb8`. The
original `#### §5.2` heading is preserved verbatim below because
`tools/d3002-pack-capability-seventeenth-fresh-review` parses the SQL DDL out of the document by
that anchor; the terminator it scans to is this file's `## §3.` heading.)*

#### §5.2 Queued evidence is admission plus durable settlement, never a delayed HTTP fiction

`POST /runs/:runId/analysis`, Story completion and automatic move enrichment do not execute their
provider call inside the admitting request. The first returns 202; the latter two may enqueue while
serving another response or after committing a move. Therefore the synchronous rule above cannot
be applied after the response has left. **HTTP 202 means only that the durable `admitted` row
committed.** It never means the provider succeeded, that evidence exists or that an unavailable
result became a successful request.

The queued operation population is closed separately from HTTP routes:

| queued operation id | sole gateway | kinds |
|---|---|---|
| `evidence.stockfish_analysis` | `EvidenceJobQueue.#execute` → `EvidenceExecutor.execute` | `bestline`, `eval`, `wdl` |
| `evidence.tablebase_probe` | `EvidenceJobQueue.#tablebasePayload` → `TablebaseSource.probe` | `tablebase` |

These are the exact operation ids already owned by `provider-health-degradation.md`; F3 consumes
its `ProviderOperationResult` and receipts rather than inventing another provider state or failure
vocabulary. The worker census is set-equal over calls through both gateway interfaces. A third
gateway, a direct engine/tablebase call, or a kind with no operation mapping fails. The queue input
does not accept a consumer, behavior, capability list or operation id from a route. One sealed
origin fixes them:

| origin | production enqueue owner | compiled consumer | terminal provider-off effect |
|---|---|---|---|
| `explicit_analysis` | `RunService.enqueueEvidence` | `runtime.analysis` | `settled_unavailable` |
| `story_completion` | `RunService.#ensureStoryEvidence` | `review.story_evidence` | `settled_empty` |
| `run_enrichment` | `RunService.#enqueueMoveEvidence` | `runtime.background_evidence` | `settled_empty` |

`runtime.background_evidence` is an operational consumer: no learner sentence is attributed to it,
and absence creates no evidence payload. Upstream callers such as import, public Story, moves,
opponent plies and group creation reach exactly one of those three enqueue owners; they do not
become extra worker gateways. The composed author artifact records the four concrete enqueue calls
(`enqueue` on all three origins plus `enqueueProducer` for run-enrichment tablebase work).

The durable authority is an additive `evidence_job_batches` + `evidence_jobs` pair plus one
`evidence_result_sequences` allocator in the
application database, claimed in one migration position behind `longitudinal-store`. A batch is the
admission and replay boundary; a job is the lease and settlement boundary. The migration owns these
exact fields:

```sql
CREATE TABLE evidence_job_batches (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN
    ('explicit_analysis','story_completion','run_enrichment')),
  idempotency_key TEXT NOT NULL,
  request_json TEXT NOT NULL,
  request_digest TEXT NOT NULL,
  job_count INTEGER NOT NULL CHECK (job_count >= 1 AND job_count <= 16),
  admitted_at TEXT NOT NULL,
  UNIQUE (id, run_id, origin),
  UNIQUE (run_id, origin, idempotency_key)
) STRICT;

CREATE TABLE evidence_result_sequences (
  run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
  next_result_seq INTEGER NOT NULL CHECK (next_result_seq >= 1)
) STRICT;

CREATE TABLE evidence_jobs (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES evidence_job_batches(id) ON DELETE CASCADE,
  batch_ordinal INTEGER NOT NULL CHECK (batch_ordinal >= 0 AND batch_ordinal < 16),
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN
    ('explicit_analysis','story_completion','run_enrichment')),
  consumer_id TEXT NOT NULL CHECK (consumer_id IN
    ('runtime.analysis','review.story_evidence','runtime.background_evidence')),
  provider_operation_id TEXT NOT NULL CHECK (provider_operation_id IN
    ('evidence.stockfish_analysis','evidence.tablebase_probe')),
  job_request_digest TEXT NOT NULL,
  request_json TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN
    ('admitted','running','retry_wait','settled_success','settled_empty',
     'settled_unavailable','cancelled','consumed')),
  attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0),
  admitted_at TEXT NOT NULL,
  lease_owner TEXT,
  lease_expires_at TEXT,
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  next_attempt_at TEXT,
  retry_basis_json TEXT,
  settled_at TEXT,
  result_seq INTEGER,
  settlement_json TEXT,
  consumed_at TEXT,
  application_receipt_json TEXT,
  CHECK (
    (origin='explicit_analysis' AND consumer_id='runtime.analysis') OR
    (origin='story_completion' AND consumer_id='review.story_evidence') OR
    (origin='run_enrichment' AND consumer_id='runtime.background_evidence')
  ),
  FOREIGN KEY (batch_id, run_id, origin)
    REFERENCES evidence_job_batches(id, run_id, origin) ON DELETE CASCADE,
  UNIQUE (batch_id, batch_ordinal),
  UNIQUE (run_id, result_seq)
) STRICT;

CREATE TABLE evidence_run_transitions (
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL UNIQUE REFERENCES evidence_jobs(id) ON DELETE CASCADE,
  from_revision INTEGER NOT NULL CHECK (from_revision >= 0),
  to_revision INTEGER NOT NULL CHECK (to_revision = from_revision + 1),
  before_run_json TEXT NOT NULL,
  before_run_digest TEXT NOT NULL,
  after_run_json TEXT NOT NULL,
  after_run_digest TEXT NOT NULL,
  first_event_seq INTEGER NOT NULL CHECK (first_event_seq >= 1),
  last_event_seq INTEGER NOT NULL CHECK (last_event_seq >= first_event_seq),
  event_digest TEXT NOT NULL,
  transition_digest TEXT NOT NULL,
  committed_at TEXT NOT NULL,
  PRIMARY KEY (run_id, to_revision)
) STRICT;

CREATE TRIGGER evidence_run_transitions_no_update
BEFORE UPDATE ON evidence_run_transitions
BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;

CREATE TRIGGER evidence_run_transitions_no_direct_delete
BEFORE DELETE ON evidence_run_transitions
WHEN EXISTS (SELECT 1 FROM drill_runs WHERE id=OLD.run_id)
  AND EXISTS (SELECT 1 FROM evidence_jobs WHERE id=OLD.job_id)
BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;
```

Transition rows are append-only application authority, not merely data carrying recomputable
hashes. The storage migration installs both triggers above in the same schema change as the table.
No application operation may update a transition. Direct deletion while its run and job remain is
refused; deletion is reachable only as the foreign-key cascade of deleting the owning durable
run/job. Re-open and replay assert the triggers exist before trusting stored history. A schema
writer that can drop migrations is outside the application-corruption boundary; ordinary SQL
through the application connection cannot coherently rewrite history ([[D2808]]).

The composite foreign key is authoritative: a child cannot repeat a different run or origin from
its batch. `request_json` parses as the exact `EvidenceBatchRequestV1` below; `job_count` equals its
ordered `jobs.length`; child ordinals are exactly contiguous `0..job_count-1`; and each child's
parsed request and digest equal that indexed batch member. Missing, extra, duplicated, crossed or
reordered children are corrupt storage. Batch parsing never trusts the duplicated columns merely
because each is independently well-formed ([[D2542]]).

**[[D2566]]/[[D2590]]:** the parser join is literal and bidirectional. `validateStoredBatch`
accepts one parsed, recursively immutable run snapshot rather than a bare node/FEN map. Its run id
equals the parsed batch request; `batchRow.run_id`/`origin` equal that request; every contiguous
child row equals its indexed parsed member on batch id, ordinal, run, origin, compiled consumer,
provider operation, request bytes/digest and node id; and the request FEN equals that immutable
node's FEN in the same snapshot. A self-consistent batch/job request for run B stored beneath run-A
columns, or an equal run-B node map supplied for run A, is corrupt even when both digests and the
composite foreign key are valid. A copied/spread snapshot loses its parser authority.

Request identity is one literal image, not “canonical JSON” left to the implementer:

```ts
interface EvidenceJobRequestV1 {
  readonly schema: "evidence_job_request@1";
  readonly runId: string;
  readonly nodeId: string;
  readonly fen: string;
  readonly kind: EvidenceKind;
  readonly depth: number | null;
  readonly movetime: number | null;
  readonly multiPv: number | null;
  readonly timeoutMs: number | null;
  readonly objectiveRequest: ObjectiveEvidenceRequest | null;
}

interface EvidenceBatchRequestV1 {
  readonly schema: "evidence_batch_request@1";
  readonly runId: string;
  readonly origin: "explicit_analysis" | "story_completion" | "run_enrichment";
  readonly jobs: readonly [EvidenceJobRequestV1, ...EvidenceJobRequestV1[]];
}
```

Every optional input is normalized to an explicit `null`; unknown/extra keys fail. `fen` is the
exact immutable node FEN, and a non-null objective request must repeat the same run/node/FEN. The
implementation imports `canonicalizeJson` from `@chess-tabiya/schema/drill-pack`. A job digest is
lowercase SHA-256 over UTF-8 `chess-tabiya/evidence-job-request/v1\0` plus those canonical bytes; a
batch digest uses the distinct prefix `chess-tabiya/evidence-batch-request/v1\0` over its complete
request. These two exported functions are the only writers and verifiers of the columns ([[D2544]]).

Provider response identity uses that same imported RFC-8785 authority, not JSON parse/stringify
round-trip. The accepted raw response must byte-equal `canonicalizeJson(parsedPayload)` before its
digest is issued. For Stockfish payloads, `engineId` equals the compiled provider instance and the
one requested depth/movetime arm equals the stored request. For tablebase payloads, `fen` equals the
stored request, `sourceId` equals the compiled provider instance and `pieceCount` is derived from
that parsed FEN rather than trusted from the response. These joins occur before a provider result
can be sealed and are reasserted inside settlement ([[D2802]], [[D2803]]).

**[[D2565]]:** both functions accept only the brand returned by the corresponding exact v1 parser.
The job parser rejects missing/extra keys, a wrong schema literal, an unknown kind, invalid search
bounds and a crossed non-null objective identity. The batch parser rejects missing/extra keys,
anything outside 1–16 jobs and any job whose `runId` differs from the batch. Hashing an arbitrary
JSON-shaped object is not an overload. Parser, digest writer and digest verifier share these exact
functions.

**[[D2588]]:** `ObjectiveEvidenceRequest` is not an opaque nested object. Its exact key set is
`runId`, `packId`, `packDigest`, `nodeId`, `fen`, `objectiveState`, `evidenceRefs`, `policyConfig`.
The parser validates the closed six-member objective-state union; the closed `seedMode`; the closed
`locus` keys and execution locus; and every exact `{id,version}` engine/model member. It recursively
copies and freezes every object and array before branding the outer job. Missing/extra nested keys,
invalid union members and crossed run/node/FEN fail. Mutating any caller-owned nested array or
policy object after parsing cannot move the accepted digest.

The production parser adds state-specific exact-key and presence checks that SQLite cannot express
without duplicating the union. `running` alone requires both lease fields. `retry_wait` requires
`next_attempt_at` plus one exact `retry_basis_json` arm: provider unavailable carries the exact
`ProviderOperationAvailability` and its optional **real** `ProviderFailureReceipt`; shutdown carries
no provider failure; expired lease may retain the last real failure. It never synthesizes a failure
receipt. Settled states require one exact `settlement_json` arm and no retry basis:

```ts
type UnavailableProviderAvailability = Extract<
  ProviderOperationAvailability,
  { readonly state: "unavailable" | "cached_exact_only" }
>;

type DurableEvidenceSettlement =
  | { readonly kind: "success";
      readonly payload: EvidencePayload;
      readonly objectiveProposal: ObjectiveEvidenceProposal | null;
      readonly acquisition: ProviderAcquisitionReceipt }
  | { readonly kind: "empty";
      readonly reason: "capability_not_configured" | "not_applicable" }
  | { readonly kind: "empty";
      readonly reason: "provider_unavailable";
      readonly availability: UnavailableProviderAvailability;
      readonly failure?: ProviderFailureReceipt }
  | { readonly kind: "unavailable";
      readonly availability: UnavailableProviderAvailability;
      readonly failure?: ProviderFailureReceipt }
  | { readonly kind: "cancelled";
      readonly reason: "caller" | "superseded" };
```

`settled_success` requires the success arm and `result_seq`; `settled_empty` requires an empty arm
and no sequence; `settled_unavailable` requires the unavailable arm and no sequence; `cancelled`
requires the cancelled arm; and `consumed` retains the byte-identical success arm and adds
`consumed_at`. A success stores `objectiveProposal: null` when the upgrader produced none rather
than omitting the member. Closing and reopening therefore applies the **same validated settled
bytes**; it never reruns the upgrader. Request bytes are parsed and both canonical job and batch
digests are rechecked. Unknown/crossed state, origin, consumer, operation, result kind, availability,
receipt generation or extra field is corrupt storage, not a best-effort job.

The retry union is literal: `{kind:"provider_unavailable",availability,failure?}`,
`{kind:"shutdown"}`, or `{kind:"expired_lease",failure?}`. Provider unavailability admits only
`cached_exact_only` or `unavailable`, whose instance set is exactly the compiled singleton provider
for this job. A failure, when present, is the sealed provider-exchange failure for the same
exchange operation and normalized job-request digest. The provider-unavailable `empty` arm carries
the same exact availability/failure authority; the `unavailable` arm has no duplicate `reason`
field. `capability_not_configured` and `not_applicable` remain the only two-field empty arms. Every
parsed row also re-derives origin→consumer and request-kind→queued-provider-operation; insertion
checks are not treated as read authority ([[D2804]]–[[D2806]]).

The strict durable-state protocol is the eleventh-repair authority at
`tools/d2563-pack-capability-eleventh-author-repair/protocol.typecheck.ts`, superseding the narrower
ninth-author shape. A `running` arm contains the complete `{jobId, leaseOwner, leaseGeneration,
jobRequestDigest}` receipt plus expiry ([[D2563]]). A `consumed` arm contains the complete
`EvidenceApplicationReceiptV1`; no other arm may carry one ([[D2564]]). Missing receipt fields and
application receipts on admitted rows are compile-time negatives.

Every claim increments `lease_generation` in the same compare-and-swap that changes the row to
`running` and returns a sealed
`{jobId, leaseOwner, leaseGeneration, jobRequestDigest}` receipt. Reclaim after expiry increments it
again even when the owner string is unchanged. Retry, cancellation and settlement require exact
state plus all four receipt fields; settlement also requires the provider result's own exact
operation/generation identity. A stale receipt affects zero rows and cannot settle, retry, heal or
cancel the newer claim ([[D2543]]).

#### Admission identity and replay

The exact author authority is
`tools/d2524-pack-capability-ninth-author-repair/admission-authority.json`. Job and batch ids are
generated with `crypto.randomUUID()` on first admission and persisted; the authority declares both
constructors. They never use a process
counter and are never regenerated on replay. The uniqueness boundary is
`(run_id, origin, idempotency_key)`; the key source is origin-specific:

The eleventh author model makes that constructor executable ([[D2569]]): UUID construction occurs
inside the `BEGIN IMMEDIATE` absence arm, after the unique-key read, once for the batch and once per
job. The concurrent winner reports those constructions; the loser/replay reports zero and returns
the stored UUIDs. Fixed candidate ids and a separately asserted constructor name do not satisfy the
contract.

**[[D2591]]:** that same lock-held worker derives `consumer_id` from the parsed sealed origin with
one exhaustive function: explicit analysis → `runtime.analysis`, Story completion →
`review.story_evidence`, run enrichment → `runtime.background_evidence`. Neither a caller nor a
constant at the insert site supplies it. The concurrency gate runs two simultaneous first flights
for each origin and proves one winning UUID population, one zero-construction replay, the exact
stored consumer and no SQL-check failure in all three arms.

| origin | durable idempotency key | canonical batch request |
|---|---|---|
| `explicit_analysis` | caller's required, canonical UUID `Idempotency-Key` | caller-ordered 1–16 node/kind/search-bound requests |
| `story_completion` | SHA-256 of canonical `{schema:"story_evidence@1",branchId,terminalNodeId}` | ordered Story evidence plan for that terminal node |
| `run_enrichment` | `run_enrichment@1:<nodeId>` | ordered compiled enrichment plan for that immutable node |

An existing key with the equal batch request digest returns the stored batch and job ids without a
provider call. The same key with different bytes returns typed `IDEMPOTENCY_CONFLICT` and writes
nothing. Versioning the internal key prefix is the explicit mechanism for a later plan revision;
changing an implicit producer set under the same prefix fails the digest check. The public analysis
client creates and retains one key across transport retry. The REST response names `batchId` plus
the ordered stored jobs.

Standalone admission and every outer run mutation use the same
`admitEvidenceBatchInTransaction` operation under `BEGIN IMMEDIATE` with the connection's existing
5-second busy timeout. After the write lock is acquired it selects the unique key. Existing equal
bytes return the stored batch/jobs; existing unequal bytes roll back with `IDEMPOTENCY_CONFLICT`.
Only absence generates one candidate batch UUID plus job UUIDs and inserts the complete batch. A
busy timeout returns the existing typed retryable storage error and writes nothing. Because the
second writer cannot pass `BEGIN IMMEDIATE` until the winner commits or rolls back, response loss
and simultaneous first flights have one observable winner; the loser re-reads rather than exposing
a uniqueness error. The author gate uses two SQLite connections released from one barrier and
requires the same stored batch id, one child population and one winner marker ([[D2545]]).

Admission is atomic per batch. Explicit analysis validates every node and all 1–16 job requests,
then inserts the batch and **all 1–16 jobs in one transaction** before returning 202. Validation,
constraint, storage or injected failure at any ordinal leaves zero batch/job rows. A replay after
response loss returns the committed batch; it cannot insert a prefix or duplicate it. If capability
support is absent from the startup projection, explicit analysis returns typed unavailable before
admission, while Story/run enrichment take their compiled honest-empty arm without pretending a
job exists. Transient health never makes an admitted row disappear: the worker observes it through
the provider operation result.

#### The one run/job transaction owner

The application-database storage adapter exposes the following closed mutation authority; service
and worker code may not sequence the underlying writes themselves:

| operation | one-transaction effects |
|---|---|
| `admitEvidenceBatch` | idempotency lookup/conflict plus one whole explicit/Story batch and every admitted job |
| `commitRunMutationWithEvidence` | run lease/CAS, complete run event bytes, and zero-to-eight enrichment batches (one per new eligible node) with every job |
| `commitRewindWithEvidenceCancellation` | run lease/CAS, rewind event, and the exact pruned-node durable-state transitions below |
| `settleEvidenceJob` | lease/generation/request check, exact settlement, and allocation/increment of the durable per-run result counter where required |
| `applyEvidenceAndConsumeJob` | parsed before-run + run lease/CAS, internally derived core/objective/recorded-guard suffix, parsed after-run + retained journal, receipt, and transition of that same success row to consumed |

Learner move, opponent ply and grouped seed creation derive the complete `run_enrichment` batch
from the post-mutation immutable node(s) before calling `commitRunMutationWithEvidence`. There is no
post-save enqueue loop. The pure runtime `rewind` result reports pruned node ids but performs no queue
side effect; the service passes both run result and ids to `commitRewindWithEvidenceCancellation`.
If either run CAS/save or any job write fails, both the old run and old job set remain. This removes
the current observer-before-save ordering rather than trying to compensate after it.

For a pruned node, rewind's transition table is total: `admitted`, `running`, `retry_wait` and
`settled_success` transition to `cancelled` with reason `superseded`; a running transition increments
the lease generation and clears its lease; `settled_empty`, `settled_unavailable`, `cancelled` and
`consumed` are retained unchanged as terminal audit rows. The `settled_success` transition is the
old in-memory “staged” case and cannot later apply. No durable `pending` or `staged` state exists.
Cancellation uses the same exact lease receipt when a worker currently owns the row; a zero-row CAS
forces the transaction to re-read/retry rather than committing the rewind against an unfenced
worker ([[D2546]]).

**[[D2567]]/[[D2592]]:** this is a row transition, not a state-label lookup. Each cancellable row writes the
`{kind:"cancelled",reason:"superseded"}` settlement, clears lease/retry/application fields and
`result_seq`, and a running row additionally increments `lease_generation`. Each retained terminal
row is returned byte-identically. Tests compare every changed or preserved field; projecting only
the destination state cannot satisfy criterion 26. Clearing a visible `result_seq` never rewinds
`evidence_result_sequences.next_result_seq`: `settleEvidenceJob` initializes that row at 1, reads
and increments it under the same `BEGIN IMMEDIATE` transaction as the job CAS, and assigns the
pre-increment value. The allocator row is retained until its run is deleted. Neither
`MAX(result_seq)` nor a process counter is permitted. The permanent sequence fixture closes and
reopens SQLite between settle → rewind → settle and requires `1 → 2`.

Workers claim with a compare-and-swap lease and increment `attempt_count`. Success atomically writes
the complete success settlement and per-run `result_seq`; the existing evidence page reads
unconsumed successful rows. Applying evidence derives every event, including an objective event,
only from that stored settlement and marks the same row consumed in one transaction. That
transaction stores this exact receipt in `application_receipt_json`:

```ts
interface EvidenceApplicationReceiptV1 {
  readonly schema: "evidence_application_receipt@2";
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly fromRevision: number;
  readonly toRevision: number;
  readonly firstEventSeq: number;
  readonly lastEventSeq: number;
  readonly eventDigest: `sha256:${string}`;
  readonly transitionDigest: `sha256:${string}`;
}
```

The range is non-empty and contiguous; its canonical event-array digest uses UTF-8 prefix
`chess-tabiya/evidence-application/v1\0`; every event is in the same run/revision transition and
the evidence reference derived from `jobId` occurs in the attached event and any objective event.
The transition digest covers the exact job/run ids, before/after revisions and run-image digests,
event range and event digest under prefix `chess-tabiya/evidence-transition/v1\0`; the transition
table retains both parsed run images and their digests, so current-image plus receipt cannot be
rewritten together while the authoritative predecessor is discarded.
Only `consumed` has a receipt, and every consumed row validates its exact event range against the
retained run. Replay after response loss returns the stored receipt without appending events; a
missing, crossed or digest-mismatched range is corrupt storage, never permission to reapply
([[D2547]]). Provider
unavailability first enters `retry_wait` under the compiled operation policy with exact availability
and any real failure retained. When the bound is exhausted, `runtime.analysis` becomes
`settled_unavailable`; Story and run enrichment become `settled_empty` with reason
`provider_unavailable`. Both retain availability and optional real failure for diagnostics. No empty
settlement mints evidence.

**[[D2568]]/[[D2587]]/[[D2589]]:** there is no public receipt constructor accepting revisions or
events. `applyEvidenceAndConsumeJob` alone receives the parsed CAS-owned before-run, stored job and
stored success. It constructs `evidence.attached`; constructs the exact
`objective.state_changed` event only for a non-null stored proposal; invokes the registered
`applyRecordedEngineGuard` authority when the before-run policy is `immediate_guard`; appends that
authority's complete zero-or-more `feedback.generated` result; saves the one-revision after-run;
then derives the exact appended journal suffix and receipt from those two retained snapshots. An
`immediate_guard` application cannot omit even an honestly empty guard outcome. The after-run must
retain the entire before-run journal byte-for-byte, and each new sequence begins exactly after its
tail. Another run, node, ref, payload, proposal, guard invocation, revision or journal prefix fails
inside the transaction. Replay returns the stored sealed result; a spread/copy cannot satisfy the
transaction-result assertion.

On process restart, `admitted` and `retry_wait` rows remain eligible, and an expired `running` lease
returns to `retry_wait` with its exact retry basis/history retained. Provider-result cancellation for
shutdown also maps to a shutdown retry basis; shutdown is never terminal `cancelled`. Only a caller
or one atomically committed superseding run-graph change may terminally cancel. A late result whose
lease, generation, job request digest or node is stale is discarded and cannot heal the provider or
settle the job. This is the before/after-202 distinction [[D2520]] required: provider loss before
durable admission can still produce a synchronous refusal; provider loss after admission is a
durable job outcome visible after restart.

The sealed provider interval is inside the lease interval: both its database-observed `requestedAt`
and `retrievedAt` are no later than the exact stored lease expiry, retrieval is no earlier than
request, and settlement still observes a live matching lease from the database clock. A response
that finishes after expiry is stale even when the settlement transaction starts before another
worker reclaims the row ([[D2807]]).


## §3. Acceptance criteria

*(criteria 20–30 of the parent, moved verbatim from lines 2649–2742 at `c37c6eb8`; numbering is kept
so the inherited ledger rows still resolve. Renumber at promotion.)*

20. **Both public-card scopes are derived, not exception-dispatched ([[D2518]]).** The API Story
    route and HTML `story_read` branch both resolve `story.public`; the HTML `session_join` branch
    alone resolves `shared.join_page`/`none`. Token lookup occurs once before capability dispatch.
    A Story provider failure cannot fall through to join, and a join token never enters Story.
    Removing either branch, restoring try-Story/catch-join, or adding a third token scope without a
    branch fails the router census.
21. **Queued providers are a closed operation population ([[D2519]]).** The two gateway interfaces
    are set-equal to `evidence.stockfish_analysis` and `evidence.tablebase_probe`; kinds are total
    and disjoint. The three production enqueue owners construct sealed
    `explicit_analysis|story_completion|run_enrichment` origins, whose consumer/provider-off pairs
    are type-fixed. A route-supplied consumer, behavior or operation; a direct provider call; an
    unclassified kind; or an extra enqueue origin fails independently.
22. **Admission survives asynchronous settlement and restart ([[D2520]], [[D2527]]).** A configured
    explicit analysis request commits one batch plus all 1–16 `admitted` jobs before returning 202.
    The composite `(batch_id,run_id,origin)` reference rejects crossed children; `job_count` and the
    exact contiguous `0..job_count-1` child population equal the ordered canonical batch request.
    An injected refusal/fault at every ordinal leaves zero rows. Response loss followed by replay of
    the equal idempotency key/digest returns the stored batch and ids; a crossed digest returns
    `IDEMPOTENCY_CONFLICT` without writes. Fixtures kill the provider (a) before admission and
    observe synchronous refusal/no row and (b) after 202 and observe a durable retry followed by
    `settled_unavailable`; the latter remains visible after closing and reopening SQLite.
23. **The durable settled value is complete ([[D2524]], [[D2525]]).** Success persists payload,
    acquisition and `objectiveProposal` value-or-null as one parsed settlement. Close/reopen before
    apply produces byte-identical evidence and objective events with zero upgrader calls. A lawful
    `unavailable` provider result with `failure: undefined` reaches retry and terminal settlement
    without a synthetic failure; real failure and exact availability survive. Crossed result kinds,
    missing explicit proposal absence, invented failure, or unavailable-without-availability fail.
24. **Every origin has one restart-stable replay identity ([[D2528]]).** Explicit analysis uses its
    validated client key; Story and enrichment use their exact versioned derived keys. Job/batch ids
    are persisted UUIDs from the declared constructors, not process counters. Job and batch request
    digests use the exact closed request types and separate `chess-tabiya/evidence-*-request/v1\0`
    canonical domains. Duplicate discovery, restart and response-loss retry produce one batch and
    one provider call per stored job. A two-connection `BEGIN IMMEDIATE` fixture releases both
    writers from one barrier and observes one winner, one stored batch/child population and the same
    stored batch id from the loser. Equal key with unequal canonical request refuses. Bumping an
    internal plan without its key version refuses. The same concurrent fixture runs all three
    origins and joins their stored children to the exact origin-derived consumer; no insert-site
    constant or caller-supplied consumer is accepted ([[D2591]]).
25. **Run mutation and automatic enrichment are one commit ([[D2526]]).** Learner move, opponent
    ply and grouped seed creation each commit their run event plus the complete internal batch/jobs
    through `commitRunMutationWithEvidence`. A fault before either side leaves the old run and zero
    new jobs; a crash after commit exposes both. A source guard fails any save-then-enqueue call or
    post-save job loop.
26. **Rewind and cancellation are one commit ([[D2529]]).** Runtime rewind has no queue observer
    side effect. `commitRewindWithEvidenceCancellation` commits the rewind event and cancellation
    of exactly the pruned-node jobs together. A total fixture covers all eight durable source
    states: admitted/running/retry-wait/settled-success cancel, while settled-empty,
    settled-unavailable, cancelled and consumed remain terminal audit rows. Running cancellation
    increments the lease generation and clears the lease. Lease conflict/storage fault leaves the
    old run and every old job unchanged; a late worker result cannot settle a cancelled generation.
27. **Settlement and consumption remain exact.** Expired leases recover; shutdown returns work to
    `retry_wait`; every claim/reclaim increments the durable lease generation, and a stale
    generation/owner/request receipt cannot retry, cancel or settle. Success writes the complete
    settlement plus a sequence allocated/incremented by the durable per-run counter in that same
    transaction; settle→rewind→restart→settle is strictly increasing ([[D2592]]). Apply derives its
    core/objective events solely from the stored settlement, composes the registered guard result
    when the policy requires it, derives before/after and appended suffix from retained run snapshots,
    and consumes the same row in one transaction. The consumed row retains the exact
    before/after revision, non-empty contiguous event range and canonical event-array digest;
    close/reopen and response-loss replay return the stored receipt, while a missing, crossed or
    digest-mismatched range fails as corrupt. Crash fixtures yield only complete earlier/later
    states—never lost work, duplicate evidence/objective events, unattached consumed rows or fake
    empty payloads. Valid immediate-guard feedback remains inside the same receipt ([[D2587]]);
    caller-supplied revisions/events, copied snapshots, mutable nested requests, unknown/crossed
    states, extra keys and origin-consumer pairs fail ([[D2588]]–[[D2590]]).
28. **Storage, provider result and replay share one authority ([[D2742]]–[[D2747]]).** Run/job
    leases are issued for and usable only with one exact application database/transaction subject.
    Settlement reparses the complete provider receipt and joins operation, evidence kind,
    generation and normalized request identity to the stored leased job before sequence allocation;
    both null and non-null objective proposals are representable and exact. Consumed replay
    reparses/rejoins request, settlement and receipt to the retained before/after transition, and
    batch replay loads its authoritative run image internally. Cross-database leases, crossed
    eval/tablebase results, malformed acquisition identity/time, corrupted consumed columns,
    floating receipt revisions and caller-supplied snapshots each fail independently.
29. **Every durable transition is complete, live and source-authenticated ([[D2771]], [[D2772]],
    [[D2773]], [[D2774]], [[D2775]], [[D2776]], [[D2777]], [[D2778]]).**
    One exhaustive state-specific parser owns every `evidence_jobs` read and rejects missing or
    forbidden lease/retry/result/clock/receipt columns. Lease acquisition and settlement compare a
    canonical internally observed transaction instant with the stored expiry. Success consumes an
    exact sealed provider delivery through its kind-specific value parser and binds response bytes,
    provider identity, endpoint, request and generation; objective proposals equal the requested
    from-state and authorized evidence set exactly. Application writes an immutable before/after
    transition record whose digest cannot be preserved by jointly rewriting current image and
    receipt. Terminal clocks are observed canonical instants, never placeholders. Independent
    fixtures fail expired leases, invented values, crossed identities/objectives, partial terminal
    rows, coordinated revision rewrites and literal clocks.
30. **Provider payload, retry, time and history authority are exact ([[D2802]]–[[D2808]]).** The
    provider result is RFC-8785 canonical and its kind-specific source/search/FEN operands equal the
    stored request and compiled provider. Retry and terminal absence parse only their closed exact
    availability/failure arms; origin fixes consumer and kind fixes provider operation on every
    read. Requested/retrieved instants fall inside the exact lease. Retained transitions reject
    update and direct delete at the storage boundary while whole-owner cascade deletion remains
    legal. Independent fixtures cross each operand, reorder equal JSON, invent retry/terminal
    fields, cross routing, finish after expiry, and coherently rewrite/delete history; each fails.

## Discharges

none

## Ledger rows

Unnumbered per [[D1503]]; renumber at landing.

- ✅ **Promotion and truthful claim ownership are complete under [[D3122]].** The Active row, file
  move, migration claim transfer and concept-registry re-point land atomically. This closes only
  registration/ownership; every inherited durable-job defect in the Status line remains open.

## Changelog

- 2026-09-06: cut out of `rfc/pack-capability-contract.md` at `c37c6eb8`. Specification bytes are
  unchanged; the preamble, scope and section numbering are new. No defect was repaired by the cut.
- 2026-09-07: registered under [[D3122]] and received the storage migration claim its DDL owns.
  No inherited operation/durability defect was repaired by registration.
