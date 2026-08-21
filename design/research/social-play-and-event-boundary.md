# Human play and events need a round trip, not a second chess platform

**Question:** platform-alignment R17 — native human play, external chess-network adapters, bot
events and the trust boundary for 1.0.

**Status:** mechanical/code/desk arms answered `[V]`; owner scope ruling remains.

## Verdict

The current product already has the right native social primitive: a private, casual friend match
around one Tabiya position run. It preserves authorship, pause-by-consent, rehearsal branches and
comparison. It deliberately has no clock, rating, public pool, resignation/draw event or fair-play
claim. `[V]` `apps/server/src/live-session.ts`; `docs/live-sessions.md` §§Native human matches,
Friend links.

The current external handoff is not yet an adapter. A host stores an arbitrary HTTPS string and a
person later pastes a PGN into one of two Arena legs. The run and imported branch survive, but no
provider, challenge or game ID exists and nothing observes game completion or retrieves the result.
`[V]` `apps/server/src/live-types.ts:78-99`; `apps/server/src/live-session.ts:219-242`;
`tools/r17-social-play-harness/conformance-output.md`.

Lichess already exposes the costly public-play substrate: rated/casual challenges with clocks,
correspondence, arbitrary-FEN input, public seeks, real-time event/game streams, game export with
clocks/opening/provider analysis, and bulk pairings. Those operations require explicit OAuth
scopes and carry provider rate/stream constraints. `[V]` official
[Lichess OpenAPI 2.0.165](https://lichess.org/api/openapi.yaml), operations `challengeCreate`,
`challengeOpen`, `apiBoardSeek`, `apiStreamEvent`, `boardGameStream`, `gamePgn` and
`bulkPairingCreate`; [API tips](https://lichess.org/page/api-tips).

The 1.0 shape supported by this evidence is therefore hybrid: keep native private learning matches;
add a typed optional chess-network round trip for clocked/rated/public play; refuse native public
matchmaking, ratings, anti-cheat and general tournaments for 1.0. A local bot tournament is a
different, bounded feature and can ship once O8's versioned bot policies exist, provided every game
is an ordinary reviewable run. This is a recommendation `[M]`; O12 owns the decision.

## 1. Capability matrix

| Capability | Native friend match | Current external Arena | Lichess adapter substrate | 1.0 implication |
|---|---|---|---|---|
| arbitrary Tabiya position | yes, untouched position run `[V]` | yes, PGN root must equal run root `[V]` | challenge `fen` exists `[V]` | preserve source run/node in all paths |
| clock | absent `[V]` | provider may have one, but Tabiya stores none `[V]` | challenge/Board stream/export carry clocks `[V]` | provider owns clock truth |
| rated play | absent `[V]` | opaque/unknown `[V]` | challenge/seek expose `rated` `[V]` | never relabel provider state |
| friend invitation | one-use expiring scoped token `[V]` | arbitrary URL `[V]` | named/open challenge `[V]` | native remains simplest casual path |
| public opponent discovery | absent `[V]` | absent `[V]` | Board seek `[V]` | delegate in 1.0 |
| result | board-terminal run only; no resign/draw verb `[V]` | caller/PGN supplies result `[V]` | live finish + export `[V]` | provider result must be attributed |
| rematch | absent `[V]` | no identity to follow `[V]` | challenge rules expose a rematch policy `[V]` | provider UI or later adapter depth |
| moderation/fair-play | no claim `[V]` | no provider attribution `[V]` | provider venue; ongoing export is delayed three plies specifically to reduce cheat-bot use `[V]` | do not manufacture a Tabiya guarantee |
| learning continuity | excellent: same run/branches `[V]` | partial: same run, manual import `[V]` | possible only if the adapter retains Tabiya source and provider game IDs `[M]` | typed envelope is mandatory |
| tournament/event | absent `[V]` | two legs only `[V]` | bulk pairing and tournament APIs exist `[V]` | public events delegated; local bot event separate |
| provider-off behavior | full native path `[V]` | manual URL/PGN `[V]` | unavailable `[M]` | native rehearsal/history must remain complete |

The matrix does **not** claim that every combination accepted by the OpenAPI fields is legal—for
example, rated arbitrary-FEN play may be constrained by provider policy. An adapter must preserve
and render the provider's accepted response rather than infer terms from the request. `[M]`

## 2. The missing primitive is external-game identity

`SessionInvitation` stores `externalChallengeUrl`; `ArenaLeg` stores that URL, PGN, result, branch
and importing handle. Neither stores provider ID, challenge ID, game ID, requested/accepted terms,
retrieval state or source node. Invitation state is created as `open`; the Arena import does not
transition it. `[V]` `apps/server/src/live-types.ts:78-99`;
`apps/server/src/storage.ts:2046-2082`.

The minimal round-trip identity tested by the disposable harness is:

```text
source:   runId + nodeId + optional packId
provider: providerId + challengeId + gameId
terms:    provider-accepted rated/casual + clock (or none)
return:   importedRunId + branchId + attributed result
```

An opaque link fails when either provider game identity is empty; the complete example passes.
This is identity and transport metadata, not chess evidence. Provider evaluations/accuracy arriving
in an export remain provider-attributed records and cannot become a Tabiya grade. `[V]`
`tools/r17-social-play-harness/social-play.test.ts`.

The adapter may then close a deterministic journey:

```text
Tabiya position → provider challenge/game → provider completion → attributed PGN import
                → same source run/branch → Review Map → retry/branch/drill/theory
```

If completion cannot be fetched, the invitation remains visibly awaiting import and the current
manual PGN route is a valid fallback. If the provider is unavailable, the native friend match and
solo rehearsal remain intact. `[M]`

## 3. Trust is divided, not inherited

There are three authorities:

1. **Tabiya** owns the source position, consent, local run, branch/review identity and its own
   evidence contract.
2. **The chess network** owns its clock, pairing, rating, result and enforcement labels.
3. **The user** authorizes provider access and may revoke it.

The adapter must never turn “played on Lichess” into “Tabiya verified this game fair.” It may say
which provider reported the result and terms. Likewise, a native private match should say
“Casual friend match · no clock · no fair-play enforcement” rather than resemble a rated venue.
This is the same honest-absence rule used by the evidence system. `[M]`

OAuth token custody, refresh/revocation, one-global-event-stream behavior, reconnect/idempotency,
rate-limit backoff, provider deletion and duplicate imports are operational requirements, not UI
polish. The Lichess tips explicitly require serialized requests and a one-minute wait after HTTP
429. `[V]` [Lichess API tips](https://lichess.org/page/api-tips). F12 owns secret/storage/health
requirements; O12/F11 would own the adapter workflow.

## 4. Bot tournaments are local events, not public infrastructure

R11 supplies candidate versioned move policies, but no event record exists. A reproducible bot
event needs only:

```text
eventId
entrant policyId + policyVersion
child game runId + white/black policy IDs
reviewRunId/result
```

The harness accepts the complete record and refuses empty policy versions. Every child game is an
ordinary Tabiya run, so Review, story, evidence and the personal observation ledger can consume it
without a parallel tournament truth model. `[V]`
`tools/r17-social-play-harness/social-play.test.ts`.

A standings table is permissible as deterministic arithmetic over recorded results; it describes
what happened and must not claim player skill. A local bot round-robin requires no public identity,
moderation, anti-cheat or population. Human public tournaments do require those operating systems
and stay delegated/deferred. `[M]`

This bounded event is valuable for the fun layer: users can compare clearly disclosed bot policies
and inspect every game afterward. It must wait for O8/F8 because an avatar tournament over raw Maia
bands would repeat the current “personality by prose” defect. `[M]`

## 5. Costed choices for O12

| Choice | Product work | Operations/trust work | Learning continuity | Verdict |
|---|---|---|---|---|
| native full platform | clocks, endings, rematch, seeks, ratings, queues, tournament state, reports/blocks, abuse tooling | continuous matchmaking population, moderation, rating integrity, anti-cheat posture, notifications and incident handling | can be excellent | highest cost; evidence does not justify for 1.0 `[M]` |
| **hybrid (recommended)** | retain private match; typed provider connection/challenge/stream/export/import; Review handoff; local bot event | OAuth/token custody, provider health, rate limits, deletion/revocation, honest provider attribution | excellent if the envelope is mandatory | bounded and compositional `[M]` |
| explicit external handoff | keep URL + manual PGN | almost none | partial and failure-prone; source/provider identity can be lost | honest fallback, insufficient as the integrated ambition `[M]` |

The adapter does not make Lichess mandatory. It is an optional breadth integration over a complete
self-hosted rehearsal core. Nor does it answer federation: cross-instance discovery, portable
identity and federated moderation remain R19/O14 and post-1.0 unless separately promoted.

## 6. Recommended O12 ruling

1. Preserve native private casual friend matches and label their absent competitive guarantees.
2. Adopt a generic chess-network adapter contract for provider challenge/game identity, accepted
   terms, completion and attributed import; implement Lichess first.
3. Require automatic result/PGN return into the originating run when authorized, with manual import
   as a provider-off fallback.
4. Delegate public/rated matchmaking, clocks, rating and fair-play enforcement to the provider for
   1.0; do not build native public pools or human tournaments.
5. Include a local/offline bot-event composition after O8/F8, using exact policy versions and
   ordinary reviewable runs. It has no human rating or fair-play claim.
6. Keep federation out of 1.0 and require a new promotion ruling before R19 designs it.

## 7. Reproduction and limits

The predeclared plan is `planning/platform-alignment/social-play/plan.md`. Run:

```sh
pnpm exec vitest run --config tools/r17-social-play-harness/vitest.config.ts
```

The focused result is 2/2. The first run caught two instrument defects—line-wrapped documentation
was misread, and the event validator accepted empty policy versions—before this report was written.
No live OAuth flow, clocked game, provider outage or user-facing journey was executed. Those are
implementation acceptance work if O12 admits the hybrid; the present result establishes the
boundary and identity contract, not provider reliability or learner preference.
