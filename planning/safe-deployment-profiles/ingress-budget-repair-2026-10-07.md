# D3334/D3335 — current ingress population and contract-repair proposal

Date: 2026-10-07. Owner: release-engineering. Scope: the explicit READY NOW contract repair
in `planning/platform-alignment/execution-queue.md`, before D1846 implementation.

This is a source audit and proposed amendment to implementing `rfc/safe-deployment-profiles.md`
§8, **not an accepted replacement specification, generated production descriptor, transport test
or completed ingress protection**. The earlier source/transport evidence remains in
`design/research/http-ingress-contract.md` and
`planning/safe-deployment-profiles/http-ingress-2026-09-30.md`.

## Source checkpoint and method

Sources were read at committed checkpoint `710d857c`, before the draft §8 repair below.
The handler family and every explicit unsafe service-dispatch branch were read, including
`parseRunRoute`, `parseSessionRoute`, both bounded/unbounded JSON readers, path/body selectors,
method refusals and the final not-found branch. The grouped operation census below was manually
derived from those branches. File hashes qualify that reading; **hash equality is not proof that
generated descriptors are consumed, and source anchors alone are not adoption tests**. `[V]`
`apps/server/src/rest.ts:467–515,804–836,954–2295`.

| Source | SHA-256 at the audit |
|---|---|
| `apps/server/src/rest.ts` | `4d6b3cfaf4f2fdd0afad9b8d21131714e0638d8948afc744eef9552d4b16827c` |
| `apps/server/src/capability-operations.ts` | `5e0ec7191b4c8cb7c79f62e3e0fc2e6ae12cfee83eeea8fb2d8013d77ee15726` |
| `apps/server/src/account-import.ts` | `2944bed5b26481e1cda3f685f44f407393389d4d50be95acbc484fa2f6282525` |
| `docs/account-data-lifecycle.md` | `c24f0ce78be26a906608e0ef1495e072e720e49118c450b1b6be969e0694b57e` |
| `rfc/safe-deployment-profiles.md` | `136ba16ca47cbbc3b63a7dcff059271972473463bd7545c565db1a2276e29957` |
| `deploy/Caddyfile.appliance` | `6b2d56c06b2d169fe5d9c2cb23dd2abc8cbcebd0e752f6c11668a36b3d3e7807` |
| `deploy/Caddyfile.hosted` | `f5d1ea41edca55aacc5d0c99b9cbac9a37253e50b31327bb151fa523d00e3132` |

## Findings that the previous missing-subset audit did not establish

1. **The numerical budget vocabulary cannot represent the shipped account importer.** Both
   authenticated import routes use `ACCOUNT_IMPORT_MAX_BYTES = 32 * 1024 * 1024` before parsing;
   canonical docs and the existing account-import test bind that value. Both proxy templates use
   the literal `max_size 8MB`; §8 permits only none/256 KiB/8 MiB. Thus the specified registry
   cannot preserve the existing importer ceiling, and the proxy's cap is below that ceiling.
   This is a source/size contradiction, **not a newly measured packaged >8 MiB upload failure**.
   The archived portable-account-data RFC explicitly excluded account import and is not authority
   for inventing a new ceiling. `[V]` `apps/server/src/account-import.ts:29–30`,
   `apps/server/src/rest.ts:967–977`, `apps/server/src/account-import.test.ts:116`,
   `docs/account-data-lifecycle.md` §Import; `deploy/Caddyfile.{appliance,hosted}` request_body;
   `rfc/archive/portable-account-data.md` §2.3/criterion 18; live deployment RFC §8.

2. **Move identity is not an actor enum.** The opponent-selection branch tests
   `value.selection !== undefined` and then refuses explicit actor/UCI. Without selection,
   `actor === "opponent"` is refused; the other branch executes `service.move`. A registry
   choosing opponent from `actor` contradicts the actual accepted transport. JSON null is
   present, not absent; invalid selection must reach the selection parser, never fall back to
   the user move. `[V]` `apps/server/src/rest.ts:2099–2134` and the moves entries of
   `apps/server/src/capability-operations.ts`.

3. **One-segment actions cannot represent `modules/query`.** The actual run regex explicitly
   admits that two-segment suffix. A generic `:action` described as one decoded nonempty segment
   cannot produce it, even if the literal operation name is added to the budget set. The
   replacement descriptor grammar needs that explicit path. `[V]` `rest.ts:804–815,1849–1872`;
   live deployment RFC §8's normalized-template convention.

4. **Router acceptance includes path aliases omitted by the canonical table.** The session
   parser permits an optional item and optional `/pgn` tail for every resource. Board/match
   and votes/invitations dispatch ignore those fields, while link/proposal item branches ignore
   the pgn tail. The repertoire parser permits `/enter` after any optional resource; delete/get,
   scan and answer branches do not all require the tail to be absent. For example,
   `POST /sessions/s/board/extra/pgn` reaches board dispatch, and
   `POST /repertoires/r/scan/enter` reaches scan. These are source-reachable aliases, not socket
   measurements or proof of authorization success. A generator that matches only canonical
   templates is not set-equal to the actual grammar. Explicitly preserve and budget them or
   explicitly refuse them in the successor contract; do not silently claim equality. `[V]`
   `rest.ts:817–836,1310–1318,1612–1641`.

5. **Unsupported requests can still be parsed.** Ordinary `/auth/*` POST parses before matching
   its action. Shape/pack draft-item branches parse before dispatching unsafe method/action.
   The generic run branch parses all POSTs, including GET-only actions, before eventually
   returning 404. Adding a registry without moving these reads leaves the pre-read refusal
   promise false. Preserve the handler's intentional authentication order separately from the
   route budget; lack of a provider must not become evidence of complete body protection. `[V]`
   `rest.ts:979–1033,1236–1244,1350–1384,1808–1814,2290–2295`.

6. **The actual closed semantic population has thirteen missing identities.** Expanding the
   existing §8 list gives 99 unsafe identities; expanding the source-derived proposal below gives
   112. The exact additions are eight account/Campaign/profile identities, four run POST actions,
   and one DELETE hint cancellation. Path aliases do not create additional semantic identities;
   they remain additional method/template acceptance to resolve. This is a manual source census,
   **not executable whole-router closure**. `[V]` the complete source table below and live RFC §8.

## Current canonical unsafe operation census

This table is a **proposed descriptor input**, not the application registry. Dotted semantic ids
follow §8's existing convention. Comma-separated suffixes expand against the row's prefix; all
listed members are explicit, not a runtime catch-all. Braces in paths denote only the listed
literal suffixes; `:<name>` denotes a captured segment. Alias resolution is separate, below.
The proposed numerical choices preserve the existing 32 MiB importer; they require contract
review before changing proxy/production bytes. `[V]` route/selector columns from `rest.ts` at the
listed anchors; `[M]` proposed budget/identity normalization where not already specified by §8.

| Method | Canonical path | Semantic identities | Selector | Proposed budget | Source |
|---|---|---|---|---|---|
| POST | `/auth/{register,login,logout,export,deletion-preview,delete}` | `auth.{register,login,logout,export,deletion_preview,delete}` | literal path | json_256k | rest:954–1033 |
| POST | `/auth/import-preview` | `auth.import_preview` | literal path, authenticate before reader | account_32m | rest:967–977 |
| POST | `/auth/import` | `auth.import` | literal path, authenticate before reader | account_32m | rest:967–977 |
| POST | `/campaigns/:campaignId/runs` | `campaign.create` | literal path | json_256k | rest:1053–1060 |
| PUT | `/campaign-runs/:campaignRunId/loadout` | `campaign.loadout` | literal path | json_256k | rest:1074–1079 |
| POST | `/campaign-runs/:campaignRunId/abandon` | `campaign.abandon` | literal path | json_256k | rest:1083–1086 |
| POST | `/campaign-runs/:campaignRunId/nodes/:nodeId/start` | `campaign.start` | literal path | json_256k | rest:1087–1090 |
| POST | `/campaign-runs/:campaignRunId/nodes/:nodeId/submit` | `campaign.submit` | literal path | json_256k | rest:1091–1092 |
| POST | `/classrooms` | `classroom.create` | literal path | json_256k | rest:1095–1105 |
| POST | `/classrooms/:classroomId` | `classroom.archive` | `op=archive` | json_256k | rest:1110–1119 |
| POST | `/classrooms/:classroomId/members` | `classroom.{member_invite,member_remove,member_accept,member_decline,member_leave}` | `op=invite,remove,accept,decline,leave` | json_256k | rest:1120–1139 |
| POST | `/classrooms/:classroomId/assignments` | `classroom.assign` | literal path | json_256k | rest:1140–1145 |
| POST | `/assignments/:assignmentId` | `assignment.withdraw` | `op=withdraw` | json_256k | rest:1150–1162 |
| POST | `/assignments/:assignmentId/submissions` | `assignment.{submit,submission_withdraw}` | op absent / `op=withdraw` | json_256k | rest:1163–1174 |
| POST | `/api/shared/:token/join` | `shared.join_accept` | literal path | none | rest:1203–1209 |
| POST | `/shapes/drafts` | `shape_draft.create` | literal path | document_8m | rest:1230–1234 |
| PUT | `/shapes/drafts/:draftId` | `shape_draft.update` | literal path | document_8m | rest:1236–1244 |
| POST | `/shapes/drafts/:draftId/lint` | `shape_draft.lint` | literal path | document_8m | rest:1242 |
| POST | `/shapes/drafts/:draftId/register` | `shape_draft.register` | literal path; currently parses JSON | json_256k | rest:1243 |
| POST | `/repertoires` | `repertoire.create` | source.kind is payload validation, not a different body budget | document_8m | rest:1297–1302 |
| DELETE | `/repertoires/:repertoireId` | `repertoire.delete` | literal path | none | rest:1310–1313 |
| POST | `/repertoires/:repertoireId/scan` | `repertoire.scan` | literal path; empty object still parsed | json_256k | rest:1314 |
| POST | `/repertoires/:repertoireId/gaps/enter` | `repertoire.gap_enter` | literal path | json_256k | rest:1316 |
| POST | `/repertoires/:repertoireId/answers` | `repertoire.answer` | literal path | json_256k | rest:1317 |
| POST | `/packs/drafts` | `pack_draft.create` | literal path | document_8m | rest:1330–1345 |
| PUT | `/packs/drafts/:draftId` | `pack_draft.update` | literal path | document_8m | rest:1350–1360 |
| POST | `/packs/drafts/:draftId/lint` | `pack_draft.lint` | literal path | document_8m | rest:1362 |
| POST | `/packs/drafts/:draftId/playtest` | `pack_draft.playtest` | literal path; empty object still parsed | document_8m | rest:1363–1379 |
| POST | `/packs/drafts/:draftId/register` | `pack_draft.register` | literal path; currently parses JSON | json_256k | rest:1380 |
| POST | `/packs/drafts/:draftId/withdraw` | `pack_draft.withdraw` | literal path; currently parses JSON | json_256k | rest:1381 |
| POST | `/runs` | `run.create` | literal path; session.kind validates creation, not budget | json_256k | rest:1409–1416 |
| POST | `/runs/import` | `run.import` | literal path | document_8m | rest:1504–1510 |
| DELETE | `/runs/:runId/share/:shareId` | `run.share_revoke` | literal path | none | rest:1652–1658 |
| POST | `/rated-games` | `rated_game.create` | literal path | json_256k | rest:1417–1424 |
| POST | `/learner-profile/share-card` | `learner_profile.share_card` | literal path | json_256k | rest:1461–1466 |
| POST | `/progress/schedules/:scheduleId` | `progress.schedule_dismiss` | `op=dismiss` | json_256k | rest:1560–1566 |
| POST | `/select-move` | `opponent.select` | literal path | json_256k | rest:1567–1597 |
| POST | `/cohorts/:classroomId/standing` | `cohort_standing.{open,close,window,publish,withdraw,show_rating,hide_rating,show_record,hide_record}` | op; showRating/hideRating/showRecord/hideRecord normalize to snake_case | json_256k | rest:1470–1502 |
| POST | `/sessions` | `live.session.create` | literal path | json_256k | rest:1600–1613 |
| POST | `/sessions/:sessionId` | `live.session.close` | `op=close` | json_256k | rest:1614–1618 |
| POST | `/sessions/:sessionId/board` | `live.board.{offer,withdraw,advance,reclaim}` | op | json_256k | rest:1620 |
| POST | `/sessions/:sessionId/match` | `live.match.{propose_pause,accept_pause,withdraw_pause,pause,resume}` | op | json_256k | rest:1621 |
| POST | `/sessions/:sessionId/links` | `live.link.mint` | literal path | json_256k | rest:1622–1624 |
| POST | `/sessions/:sessionId/links/:linkId` | `live.link.revoke` | `op=revoke` | json_256k | rest:1625 |
| POST | `/sessions/:sessionId/proposals` | `live.proposal.create` | item absent | json_256k | rest:1627–1629 |
| POST | `/sessions/:sessionId/proposals/:proposalId` | `live.proposal.{apply,decline}` | item present, op | json_256k | rest:1629 |
| POST | `/sessions/:sessionId/votes` | `live.vote.{open,cast,close}` | op | json_256k | rest:1631–1633 |
| POST | `/sessions/:sessionId/invitations` | `live.invitation.create` | literal resource; body leg validates payload | json_256k | rest:1635–1637 |
| POST | `/sessions/:sessionId/legs/:leg/pgn` | `live.leg.import_pgn` | leg=1 or 2 before text read; `text/x-chess-pgn` | document_8m | rest:1639–1641 |
| DELETE | `/runs/:runId/hints/:requestId` | `run_action.hint_cancel` | lowercase 32-hex request id | none | rest:1645–1651 |
| PUT | `/runs/:runId/marks` | `run_action.{marks_replace,marks_rescope}` | rescopeFrom absent / present | json_256k | rest:1788–1807 |
| POST | `/runs/:runId/moves` | `run_action.{move_user,move_opponent}` | selection absent / present, then actual parser validation | json_256k | rest:2099–2134 |
| POST | `/runs/:runId/grants` | `run_action.{grant,revoke}` | op=grant,revoke | json_256k | rest:2029–2046 |
| POST | `/runs/:runId/modules/query` | `run_action.modules_query` | explicit two-segment suffix | json_256k | rest:1849–1872 |
| POST | `/runs/:runId/{assistance,hints,opponent-ply}` | `run_action.{assistance,hints,opponent_ply}` | literal suffix; do not treat provider configuration as route admission | json_256k | rest:1815–1848,2079–2098 |
| POST | `/runs/:runId/{deletion-preview,delete,distill,reasoning-review,voice,speech,share,flip,lease,reveal,duplicate,schedule,group,group-reply,rewind,fork,compare,branch-decidedness,analysis,simulate,simulate-enter,prediction,reasoning,evidence}` | `run_action.{deletion_preview,delete,distill,reasoning_review,voice,speech,share,flip,lease,reveal,duplicate,schedule,group,group_reply,rewind,fork,compare,branch_decidedness,analysis,simulate,simulate_enter,prediction,reasoning,evidence}` | literal suffix; nested scope/source/rung values validate payload, not budget identity | json_256k | rest:1874–2078,2136–2290 |

Partition proposal: **4 none + 10 document_8m + 2 account_32m + 96 json_256k = 112** unsafe
identities. This is not permission to skip required JSON merely because a command ignores its
payload: shape register, pack register/withdraw and empty-object scans/playtest currently parse
JSON. It also does not imply that the document8m budget for playtest is the ideal long-term choice;
the proposal retains §8's declared assignment instead of silently redesigning it.

The thirteen literal additions, independent of grouping, are:

```text
auth.import
auth.import_preview
campaign.create
campaign.loadout
campaign.abandon
campaign.start
campaign.submit
learner_profile.share_card
run_action.assistance
run_action.hints
run_action.modules_query
run_action.opponent_ply
run_action.hint_cancel
```

The run grammar's GET operations also need explicit zero-body method descriptors, including the
previous table's missing `marks`, `review`, `nudge` and `review-analysis`. A POST for `graph` or
another GET-only action is not an extra successful unsafe semantic operation. Currently it can
read JSON before 404; the replacement must resolve its refusal before that read. GET/HEAD body
handling and authentication/status behavior must be specified, not inferred from the unsafe-id
count. `[V]` `rest.ts:1666–1807,1808–1814,2290–2295`; §8's earlier GET list.

## Buildable admission order proposed for §8

1. Keep existing native receive bounds and Host/Origin/Fetch-Metadata policy. Match raw path,
   normalized captured segments, method and content type against the generated descriptor.
   No JSON body selector participates in this pre-body operation. Encoding validation must
   preserve existing identifier treatment; it is not an excuse to permit arbitrary suffixes.
2. A known refusal / no-body route uses an explicit zero-body policy. For a real JSON route,
   choose its **transport envelope** from the maximum of its declared semantic byte limits.
   Every current body-selected operation above shares one limit with its siblings: 256 KiB.
   No current selector requires guessing between a 256 KiB and document-sized envelope.
3. Apply declared-length and incremental raw-byte limits before JSON decode/concatenation.
   Parse once within that route envelope, validate the existing selector, then bind the resulting
   exact semantic descriptor and check any stricter semantic limit. Unknown body selectors
   return the existing typed invalid-request family **after a bounded read**, not a fictional
   zero-byte read. No second discriminator header/URL and no default budget.
4. Preserve account authentication-before-upload and its existing typed
   `ACCOUNT_IMPORT_TOO_LARGE` refusal, or specify the compatibility mapping explicitly.
   Proposed `account_32m` represents the entire serialized request, not just the bundle field.
   The edge guard must admit that declared limit for the two exact account routes; an ordinary
   command must not inherit it. Generate matching proxy route caps from the same authority, or
   document an explicitly larger outer guard while retaining strict Node operation limits.
   Do **not** silently lower the importer to 8 MiB or raise every application command to 32 MiB.
5. Alias policy is an explicit contract repair, not metadata. Recommended `[M]`: use only the
   canonical templates above, refuse item/pgn tails where the operation does not consume them,
   and retain `/enter` only for repertoire gaps. Prove those formerly reachable source aliases
   change to an early typed refusal, rather than asserting set equality to unchanged grammar.
6. The compiled descriptor must be consumed by the actual handler body reader and actual
   method/selector dispatcher, not merely published in a census or scanned for an anchor.
   Successful operations never execute before selector/content-type/raw-byte validation.

The numerical/source conventions and alias-policy recommendation are proposals requiring the
normal RFC repair/review boundary. No production file, proxy configuration, account limit,
wire format, semantic capability version or protected intent changed in this source audit.

## Required negative controls and discharge boundary

- Exact missing/extra/crossed method-template-operation joins fail generation; a thirteenth
  omitted operation is not admitted through a default. Same count with a wrong member fails.
- An actual newly added unsafe router branch without a descriptor fails; source anchors alone
  do not satisfy this control. The explicit two-segment module route must reach its existing
  service operation, not 404.
- In equal pre-body metadata, `{"op":"leave"}` versus `{"op":"bogus"}` (14 bytes each) proves
  only bounded post-parse semantic discrimination. Test actual body bytes read, no side effect,
  and typed invalid request; do not reassert zero bytes for the unknown selector.
- `selection` absent/present/null, forbidden explicit actor/UCI with selection, unknown grant op,
  absent/null/unknown submission op and marks-rescope selector each test the actual dispatcher.
- Unknown auth suffix, draft method/action, GET-only run POST and the chosen alias refusals do
  not consume JSON or start services. Preserve intentional auth/disclosure order and refusal
  status explicitly; wrong method cannot accidentally receive a document envelope.
- Account import/preview retain their existing 32 MiB request bound at Node and through the
  exact rendered proxy, with anonymous pre-read refusal and byte-limit/limit+1 cases. Compare
  ordinary JSON and document routes at their own boundaries; no blanket cap or proxy-only pass.
- Declared/chunked/missing-length bodies, split multibyte UTF-8, compressed encoding, malformed
  JSON, pending-read cancellation and socket reuse/refusal each retain typed outcomes without
  response-socket destruction or a late second 500.
- All successful unsafe families, valid unauthenticated register/login, no-body join/delete/cancel,
  import, Campaign, modules, hints, bot moves and Studio/repertoire/social operations remain
  reachable. Read-only HEAD/GET behavior is independently covered.

D3334/D3335 remain open until the amended contract passes fresh review with executable
grammar/population/selector controls. That is contract admission, not a demand to implement before
acceptance. D1846 remains blocked until the real application and proxy enforce the accepted
contract, with generated-reader/dispatcher adoption and actual transport controls. This audit does
not close either row, promote release readiness, or claim
that an authenticated packaged deployment or browser journey was run.

## Draft amendment flow-back

The existing live RFC's §8 and criterion 8 are amended **in draft**, with a top-level admission
hold, index notice and changelog. They now contain the 112-id population, bounded transport then
semantic resolution, explicit module/move grammar, account32m preservation and alias refusals.
The source hashes above preserve the predecessor reading, not the amended RFC's current bytes.
Acceptance remains with fresh review; no production implementation precedes that boundary.
None means zero allowed/retained payload, not zero native observation when checking a chunked
empty/nonempty body. Known route/method refusals can still cancel unread uploads immediately.

## Read-only source-grammar verification

Ten diagnostic controls execute the exact regex literals extracted from the SHA-bound current
`parseRunRoute`, `parseSessionRoute` and repertoire route declarations. They retain module-query
acceptance; unknown/extra run suffix refusal; the GET-only graph grammar member; board-item/pgn
and votes-item aliases; repertoire scan/enter and item/enter aliases; equal-length member op
bodies; and null-selection presence. All ten pass. These are current grammar/arithmetic controls,
**not production HTTP/authentication, service dispatch, bounded-reader or permanent CI tests**.
`[V]` actual regex literals at `rest.ts:808,823,1310`; the ten named diagnostic results in this
pass, evaluated directly without compiling or changing production sources.

Separate read-only set expansion compares the complete 56-row table, predecessor RFC from
`git show 710d857c:rfc/safe-deployment-profiles.md`, and amended RFC's literal unsafe block:
99 predecessor identities; 112 unique table identities; 112 amended identities set-equal to the
table; thirteen additions and zero removals. Expanded budgets are 96/2/4/10 for JSON/account/none/
document respectively. Same-count wrong joins and actual descriptor/dispatcher adoption remain
required negative controls; passing this calculation does not close them. `[V]` those exact
source blocks, brace-expansion/set comparison and the terminal read-only calculation result.

## Checkpoint verification boundary

Normal `make staged-process-contracts` terminates zero on the twelve-file owned change set:
register C1–C8, lifecycle P1–P7, work routing/state, roadmap R1–R10/sealed receipt, protected-intent
parity and append-only closeout pass. All 1,689 live rows remain assigned/routed, zero untriaged.
The exact staged software/Make/config/content/tool/CI/deployment paths remain byte-identical to
the full proof at `082a935d0b863e73fbc72784c0c579d68b9b4725`. That previous software/content
coverage is reused for unchanged bytes, **not a new full suite, fresh governance tier, browser,
GitHub, deployment or application-limit test run**. `[V]` actual staged-tree comparison and terminal
process gate; previous immutable proof
`planning/semantic-consequence-search/d3262-cost-engine-depth12-software-2026-10-07.json`.

The independent D3262 top8 capture stays live; its unfinished population is not counted. Light
source reads, metadata validation and ordinary commit hooks can overlap this non-isolated host
capture; full software/performance and CPU-heavy source/model experiments are not launched in
parallel. No elapsed interval is replaced, resampled or described as an isolated benchmark.
