# Campaign core — third fresh independent buildability review

- **Date:** 2026-08-31
- **Artifact:** `rfc/campaign-core.md` after the [[D2244]]–[[D2252]] third author repair
- **Verdict:** return to author on [[D2420]]–[[D2427]]
- **Executable review:** `make campaign-two-horizon-third-fresh-review` — 8/8
- **Author controls:** `make campaign-two-horizon-author-contract` — 34/34
- **Production authorization:** none

## What survived

The earlier repairs remain useful. The RFC keeps Campaign foundation separate from complete 1.0;
requires a learner-play witness before progression; gives creation a pre-run command identity;
requires one cross-aggregate start transaction; refuses active encounter deletion; routes earned
inventory toward the ordinary module query; and types official curriculum metadata. The closure map
still keeps full-game bosses, catalogue progression and consequential durable variety inside 1.0.

The return is not a reversal of those choices. It is the result of joining their author model to
the normative SQL, the accepted account lifecycle and the exact theory/chronology semantics.

## Return findings

1. **[[D2420]] — concurrent create is not database-enforced.** The prose promises a partial unique
   active-run index, but the DDL has only `idx_campaign_runs_learner(learner_id,status)`. The author
   model's pre-transaction array check cannot falsify two SQLite writers. The repair needs the real
   partial unique constraint and a real transaction race fixture.
2. **[[D2421]] — the event algebra does not inhabit its table.** `expected_revision` is `NOT NULL`,
   while both `campaign_created` and the author model's `node_entered` omit it. Creation is also
   explicitly the command before expected revisions begin. Define the discriminant/value rather
   than letting the implementer invent one.
3. **[[D2422]] — durable replay has no durable command envelope.** Later commands promise stored
   normalized operands and byte-identical result replay, but `campaign_events` stores neither an
   operands digest nor result payload. The author model adds both as undeclared in-memory event
   properties. Projecting that event to the stated SQL columns turns a valid retry into
   `CAMPAIGN_COMMAND_REUSED`; reading the mutable play-run row cannot recover the original start
   response after play advances.
4. **[[D2423]] — theory delivery drops applicability and disclosure.** §3.2 requires both, but
   `campaignAssistanceAuthority` authorizes an owned passage from only module and source state; the
   subsequent compiler list also omits the two theory-specific gates. The executable negative marks
   a passage inapplicable and move-direct and it is still authorized.
5. **[[D2424]] — sealed encounters are temporally widened.** The authority admits a sealed run but
   reads today's campaign revision and inventory. An Act-I Review opened after Act III can therefore
   gain later modules and passages. A sealed read needs an exact campaign-event cut; active play
   needs its own explicit authoritative cut.
6. **[[D2425]] — official curriculum metadata is not curriculum evidence.** Phase arrays need only
   contain a document node, so one opening node may self-label all three phases. Theory `nodeId` and
   dependency `requiredAt` accept ghost nodes. Join exact pinned pack phase/form/theory/dependency
   authorities and require the intended coverage rather than checking merely non-empty ids.
7. **[[D2426]] — account lifecycle imports a refused feature.** The accepted and implemented
   portable-account contract says there is no account-import route, parser or UI. Campaign requires
   export→delete→restore and learner-account merge/rekey. Whole-installation backup restore is not
   account import. Remove those criteria or add a real successor contract and dependency.
8. **[[D2427]] — abandoned encounter deletion has no history result.** The RFC permits abandoning
   and then deleting the active play run. That leaves `node_entered` without `node_committed`; the
   only missing-run Review projection requires a seal, and the author model returns
   `CAMPAIGN_NODE_UNAVAILABLE`. Specify the abandoned-unsealed projection and its export/restore and
   corruption behavior.

## Why the green author contract was insufficient

The 34 author arms prove the intended local model. They do not project that model into the exact SQL
columns, run concurrent database writers, use the accepted account contract, carry theory-specific
gates, or evaluate a sealed encounter at an earlier event cut. The third-review target does each
minimum counterexample directly. All eight findings are able to fail when repaired.

## Required next pass

Repair the SQL/event/command envelope as one persistence authority; bind theory and sealed reads to
exact applicability, disclosure and event cuts; make curriculum metadata a join rather than a
self-assertion; reconcile deletion and account lifecycle with accepted operations; then rerun both
maintained targets and request another fresh independent review. Do not land schema, migration,
storage, routes, UI or official content from this returned draft.
