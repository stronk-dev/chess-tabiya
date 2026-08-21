# Coach and streamer are composed workflows, not new evidence modes

**Questions:** platform-alignment R15/R16 — what coherent coach and streamer workflows exist, what
remains, and where can role/default composition leak assistance?

**Status:** mechanical/code/desk arms answered `[V]`; owner use remains under D649.

## Verdict

Tabiya does not need a separate coach engine, streamer evidence service or per-viewer truth path.
It needs two explicit workflow compositions over the live-session, assistance-module and evidence
contracts that already ship.

The streamer core is substantially complete. The overlay reads the shared run state and live
session detail, shows board/objective/branch count/marks/vote/withholding, attributes relayed votes,
and makes no human-split, corpus, analysis, voice or evidence-provider query. The service and UI
both support 2–8 legal options. No Twitch/YouTube/OAuth bridge and no editorial audience-delay
mechanism exists; two-second polling is transport latency, not a disclosure policy. `[V]`
`tools/r15-r16-professional-workflow-harness/conformance-output.md`.

Synchronous academy coaching also ships mechanically: host-directed board possession, participant
proposals/votes, spectators, shared reveal, a multi-board wall, per-run grants, move authorship and
session distillation. Asynchronous classroom work is absent in code but already fully specified by
accepted `rfc/teacher-surface.md`: roster addressing is separate from per-run observation consent;
assignments point only to registered packs; submissions mint bounded review grants; no class-wide
progress or weakness dashboard exists. `[V]` current code and accepted RFC.

The unresolved product issue is composition. `stream` and `match` have explicit assistance
preference profiles; `academy` maps to the underlying `position` profile. Permission itself ignores
live kind entirely. After disclosure, solo/host may request human/corpus evidence while
participant/spectator remain locked and sight-capped. Thus a host-seated match player outranks the
participant-seated opponent—a known D80 defect owned by `teacher-surface`—and Academy silently
inherits Just Play settings—a D636 defect not owned by that RFC. `[V]` 24-cell matrix.

## 1. Current workflow inventory

| Job | Stream | Synchronous academy | Async teacher |
|---|---|---|---|
| create from a run | ships, host | ships, host | accepted RFC: assignment points to registered pack |
| board control | host/free/rotation | host/free/rotation | learner owns submitted run |
| participants act | propose/vote/claim when allowed | propose/vote/claim when allowed | submit/withdraw one run |
| audience follows | overlay or authenticated spectator | spectator/shared board | teacher gets only submitted run grant |
| reveal/evidence boundary | run-owned, viewer-blind | run-owned, viewer-blind | finished+disclosed+submission grant |
| exact authorship | possession journal | possession journal | submission identity + ordinary run evidence |
| return artifact | story/replay/distill | story/replay/distill | assignment/submission list; no mark/grade |
| persistent roster | unnecessary | unnecessary for one session | accepted RFC, unimplemented |
| external provider bridge | absent | not applicable | not applicable |
| workflow-specific preset | stream profile exists | **absent; inherits position** | review permission specified; default module composition open |

`[V]` `apps/server/src/live-session.ts`; `apps/web/src/App.svelte` live routes;
`apps/web/src/lib/assistance-preference.ts`; `rfc/teacher-surface.md`.

## 2. Assistance and disclosure matrix

The disposable instrument evaluates `stream|academy|match × solo|host|participant|spectator ×
delivery closed|open`. The permission record is byte-identical across all three kinds. Before
delivery opens, human-split/corpus are locked and lighting/arrows stop at sight for every role.
After it opens, solo and host reach evidence; participant and spectator do not. `[V]`
`tools/r15-r16-professional-workflow-harness/conformance.test.ts`.

That policy has three distinct consequences:

1. **The overlay cannot leak an engine feed.** It never calls those consumers, and its visible
   withholding state comes from the shared run projection.
2. **A streamer may reveal their own assistance on video.** The accepted limitation remains
   correct: a host can always spectate their own run from another account. Tabiya can protect the
   run from premature disclosure; it cannot force a streamer not to show their own screen.
3. **Governance role is not playing status.** In a match, one seated player can be host and the
   other must be participant. D80's accepted fix adds `seatedInContest` and narrows the host down
   while the contest remains open. This is a fair-play repair, not a new coach feature.

No editorial broadcast delay exists. Adding one would not protect a streamer from themselves and
would create a second time-dependent projection beside the run's disclosure barrier. The safe 1.0
default is the existing overlay: shared state, evidence omitted until the run discloses, with video-
platform delay left to the broadcaster. A future public-event broadcast with opposing players may
need a separate research question; it must not be smuggled into Stream mode.

## 3. Vote and adapter boundary

The live service validates 2–8 legal UCI options, 15–600 seconds, one vote per derived voter key,
50,000 distinct keys and stale-on-node-change behavior. Only one configured, already-granted
learner may submit external `voterKey` values. The session and overlay state how many votes were
relayed, identify the adapter when it resolves and say Tabiya cannot verify chat identity. `[V]`
`apps/server/src/live-session.ts`; `apps/web/src/lib/live-vote.ts`; `docs/live-sessions.md`.

No provider adapter authenticates to Twitch or YouTube. That is an integration absence, not an
evidence gap. A provider bridge should remain outside the run core and own provider credentials,
chat moderation and mapping into the already bounded vote API. Tabiya should not ingest/render raw
chat merely to claim streaming support. The core's responsibility is authenticated adapter
identity, bounded intake, attribution and replayable tally state; those parts ship.

## 4. Academy needs an explicit composition

`assistanceProfile` special-cases Stream and Match, then returns the underlying run session kind.
An Academy session over a position run therefore reads/writes `tabiya.assistance.v1.position`.
Changing Just Play preferences changes Academy, and an Academy choice changes Just Play. `[V]`
`apps/web/src/lib/assistance-preference.ts`.

That is not merely a missing key. O4 rules that normal workflows expose opinionated modules and
presets, and that preset identity stays separate from source-run preferences. Academy is one of the
named workflows. The accepted Teacher RFC deliberately leaves defaults alone and even argues
against a seventh profile; the later O4 ruling and D636 measurement now require an explicit owner
amendment rather than an implementer quietly adding one.

The smallest coherent compositions are:

- **Teach live / learner board:** legal lighting; post-commit pattern/theory nudges; participant
  proposals and coach-controlled shared reveal; direct move/PV help off unless the learner and
  coach explicitly select Support/Analyze. Session members and coach authority remain visible.
- **Teach live / coach controls:** session/assignment controls plus an analysis drawer after the
  run disclosure boundary; evidence stays on the same sealed producers and is attributed. The
  coach may reveal to the room but gets no hidden grading service.
- **Review submission:** the accepted Teacher RFC's finished/disclosed/submission-only grant; the
  reviewing teacher receives the run host's own assistance ceiling, never a class-wide summary.

Exact module counts/names still need owner use with F5. What cannot remain open is whether Academy
has an identity at all: it must, or the settings boundary lies.

## 5. Ownership and planning correction

`rfc/teacher-surface.md` is accepted, states that no owner item remains and records an explicit
owner override to ship rather than defer. The execution queue nevertheless says “Teacher waits on
R15/O11 or amendment,” while R15 was itself marked blocked on participant work. D649 later moved
the external participant arm out of scope. `[V]` current register/queue.

The research cannot revoke an accepted owner ruling. Teacher implementation may proceed under its
accepted RFC after normal active-RFC collision reconciliation; O11 owns only the later workflow
composition and any amendment it requires. In particular:

- D80/D92/D93 and the roster/assignment/submission mechanism stay with `teacher-surface`;
- D636's explicit Academy profile/default composition belongs to O11/F5/F11 and requires an
  amendment because the accepted RFC argued the opposite;
- provider adapters remain an optional integration behind the generic vote boundary; and
- R17/O12 own competitive broadcasts, human play and tournament/fair-play scope.

## 6. What may proceed and what remains refused

O11 may rule two composed workflows, an explicit Academy profile, the generic adapter boundary and
the no-editorial-delay 1.0 posture. The accepted Teacher RFC may implement its already-ruled async
contract. F5 owns reusable module/preset mechanics; F11 owns only professional workflow integration
that survives O11.

Still refused:

- separate coach/stream evidence producers or a per-viewer truth path;
- ambient roster access to learner history;
- teacher weakness/mining dashboards;
- engine grades or LLM diagnoses presented as teacher authority;
- raw-chat ingestion as a core requirement;
- match fair-play rules inferred from Stream/Academy; and
- calling transport polling an audience safety delay.

Owner use remains necessary to tune layout, module names and default density. It is not required to
identify the missing Academy identity, establish overlay non-leakage or honour the accepted Teacher
RFC.

## 7. Reproduction

The plan is `planning/platform-alignment/professional-workflows/plan.md`. Run:

```sh
pnpm exec vitest run --config tools/r15-r16-professional-workflow-harness/vitest.config.ts
```

