# Professional workflow 1.0 closure — the joins the feature inventory hides

**Question:** Does the current coach/classroom/streamer/casting stack form the complete 1.0
journeys promised by `planning/roadmap-to-done.md` §11, and does one accepted or active contract
own every missing join?

**Status:** current-code and contract audit complete `[V]` at 2026-08-30. No recruited-user or
external-product hands-on claim is made. The older competitor arm remains `[P]` and thin per
`ux-teacher-and-classroom.md`; that limits interface validation, not the code/ownership findings
below.

**Method:** read the current route, live-session, classroom, preset and casting authorities; join
each roadmap exit clause to a producer, authorization check, route and user action; execute
`tools/d2261-professional-closure-audit/contract.test.mjs`. This is a disposable research
instrument under the RFC exploration gate, not production code.

## Verdict

**The backend primitives are real, but the professional capability is not one product yet.** `[V]`
The August 29 work repaired much of the old teacher dossier: the roster × assignment grid, named
submissions, proposal actions, wall timing, classroom identity, OBS instructions, audience preview,
signed-in voting and watch links now render. The stale summary “almost no user experience” should
not be used at current HEAD. `apps/web/src/App.svelte:1621-1713`; focused component tests in
`apps/web/src/lib/app-shell.test.ts:916-1040`.

Five joins remain foundational:

1. **Live-followed casting and streaming a rehearsal are different workflows with one name.**
   `casting.md` defines a cast as followed source → immutable cut → stream session → overlay →
   liveness guard, and explicitly puts a non-followed run out of scope. The shipped selector defines
   *Stream a rehearsal* over any eligible hosted run. `[V]` `rfc/casting.md:79-98,260-270`;
   `apps/web/src/lib/live-creation.ts:3-18,46-50`. The former needs source liveness and delay; the
   latter needs streamer privacy, capture and rehearsal controls. Making `casting.md` the sole
   professional RFC leaves the ordinary streamer journey ownerless. [[D2261]].
2. **Streamer privacy mode is not the chrome-free overlay.** The overlay is a separate disabled
   projection. The streamer's working board has no user-selectable closed privacy state for handles,
   ratings, assistance/evidence rails, authored markers and shell chrome. `[V]`
   `apps/web/src/App.svelte:1195,1701-1730`; `apps/web/src/lib/router.ts:12-18`. A route-level boolean
   cannot state what is hidden, persist a choice, or preview it. [[D2262]].
3. **Review Submission loses the submission at the click.** The assignment grid navigates to the
   generic run route using only `runId`. The route algebra contains no classroom/assignment/
   submission review subject, so the screen cannot name the learner, assignment, access expiry or
   return cell. `[V]` `apps/web/src/App.svelte:1641`; `apps/web/src/lib/router.ts:12-18,63-78`.
   Per-run consent remains enforced by the run grant, but consent is not a usable review workflow.
   No teacher-response artifact is specified; whether 1.0 needs an attributed comment/mark is an
   owner choice, while retaining context and returning to the grid are not. [[D2263]].
4. **Classroom teacher and live-session coach are unrelated authorities.** A classroom may contain
   several active teachers, but every coaching mutation ends at `#requiredControl`, which checks only
   the run role. Classroom membership is consulted when creating/naming a classroom session, never
   when resolving proposals, opening votes or managing the board. `[V]`
   `apps/server/src/live-session.ts:52-75,115-127,330-336`; `apps/server/src/classroom.ts:74-113`.
   Ambient classroom power must remain refused; the missing object is an explicit, per-session coach
   capability accepted by the run host. [[D2264]].
5. **Scheduling and admission do not compose.** The accepted Teacher contract deliberately says a
   classroom session confers no membership or grant. The current classroom projection then renders
   each upcoming session as title + time only, without join action, invite/admission state or stated
   reason it is unavailable. `[V]` `rfc/archive/teacher-surface.md:592-610`;
   `apps/web/src/App.svelte:1643`. The consent decision is sound; the inert calendar row is not a
   workflow. [[D2265]].

## Contract findings that already have owners

- **The Academy preset remains internally contradictory.** Runtime declares `academy` default
  `guided`, while the raw technical preference fallback is `SILENT_ASSISTANCE`. `[V]`
  `packages/runtime/src/presets.ts:46-48`; `apps/web/src/lib/assistance-preference.ts:6-17`.
  [[D1548]] and [[D971]] already own the missing presence bit and literal preset→config compiler;
  [[D315]] owns the remaining Academy behavior. Do not create a second fix.
- **Delayed live votes are ruled, not open.** [[D1291]] requires an owner-configurable delay and
  discharges casting D3, but `casting.md` still leaves D3 blank and its acceptance criteria only
  test refuse-live/allow-released. `[V]` `design/BACKLOG.md` [[D1291]]/[[D1472]];
  `rfc/casting.md:301-303,322-330`. The RFC must absorb the ruling before implementation.
- **The liveness lock is genuinely absent.** `sourceGameLive` exists only in prose at this cut;
  `live-following.md` owns the growing source and fail-closed release, while `casting.md` owns its
  audience readers. `[V]` source census executed by the retained harness. This is dependency work,
  not evidence that the overlay itself leaks at rest.
- **The provider bridge is absent but not an evidence collector.** The bounded adapter vote API is
  present; Twitch/YouTube authentication and chat-to-vote translation are not. `[V]`
  `apps/server/src/live-session.ts:76-78,255-276`. It must remain outside the run/evidence core and
  ship an honest disconnected/source-off state. [[D704]] already records the boundary.

## Required 1.0 decomposition

The shared primitives stay shared; the journeys do not collapse into one generic Live form. `[M]`

| workflow | required composition | must not inherit |
|---|---|---|
| Teach Live | classroom/session identity, explicit coach capability, learner admission, Academy preset/ceiling, wall triage, proposals/marks/reveal/board handoff, reconnect and end state | ambient classroom access; engine-ranked learner triage |
| Review Submission | submission identity, named learner/assignment/access window, sealed run projection, attributed response decision, return to roster cell | generic “open run” with context lost; class-wide weakness mining |
| Stream rehearsal | streamer privacy preset, working board, OBS output/preview, signed-in audience/votes, provider disconnected state | followed-source liveness rules when the subject is the streamer's own rehearsal |
| Cast followed game | follower/cut identity, liveness clamp, delayed vote cursor, redistribution/licence decision, released transition, source-off recovery | live evaluation; undelayed audience computation |

This decomposition preserves [[D705]]'s useful architectural recommendation—compositions consume
the sealed evidence rail rather than inventing coach/stream truth—but [[D705]] is still an idea row,
not the ruling `casting.md` claims it is. O11 must ratify or reject that premise before the successor
contract is accepted.

## Research sufficiency and next gate

The code/contract evidence is sufficient to return `casting.md` and commission one successor
professional-compositions RFC after O11: all five closure findings are observable from current
interfaces and have falsifiers in the retained instrument. `[V]`

Research is **not** sufficient to claim the defaults or screen density are good. The repo still has
no owner-device two-account classroom/coach/OBS/provider-off walkthrough and no authenticated
hands-on teardown of the closest classroom tools. `[V]` `planning/ux-implementation-index.md`
LIV-a24/a25 and TCH-a32/a33. Those are validation and competitor-adoption arms; they must not be
used to keep the missing authority and route contracts vague.

## Falsifiers retained

Run `make professional-closure-audit`. It fails if the evidence disappears rather than being
repaired: if ordinary Stream ceases to accept non-followed rehearsals, Review Submission gains a
typed route, co-teacher authority gains an explicit bounded operation, upcoming sessions gain an
admission action/state, streamer privacy gains a declared surface, or casting absorbs [[D1291]].
Each positive change should close the corresponding row and replace the assertion with the
successor RFC's acceptance test.
